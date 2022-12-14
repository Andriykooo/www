import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { Role } from 'src/enums/role';
import { CreateUserDTO } from './dto/createUserDto';
import { UpdateBalanceDTO } from './dto/updateBalanceDto';
import { User, UserDocument } from './schemas/user.shema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(RegisterDTO: CreateUserDTO, { id }) {
    const { password, email } = RegisterDTO;
    const user = await this.userModel.findOne({ email });

    if (user) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = new this.userModel({
      ...RegisterDTO,
      password: hashedPassword,
    });

    await createdUser.save();

    if (id) {
      const referalUser = await this.userModel.findById(id);

      if (referalUser.roles.includes(Role.INVESTOR)) {
        referalUser.invitedUsers.push(createdUser._id.toString());
        await referalUser.save();
      }
    }

    return await this.userModel.findById(createdUser._id).select('-password');
  }

  async findOne(email: string): Promise<User | undefined> {
    return this.userModel.findOne({ email }).lean();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async increaseBalance(data: UpdateBalanceDTO): Promise<number> {
    const { amount, id } = data;
    const user = await this.userModel.findById(id);
    user.balance += +amount;

    if (!user.roles.includes(Role.INVESTOR)) {
      user.roles.push(Role.INVESTOR);
    }

    await user.save();

    return user.balance;
  }

  async decreaseBalance(data: UpdateBalanceDTO): Promise<number> {
    const { amount, id } = data;
    const user = await this.userModel.findById(id);

    if (user.balance < amount) {
      throw new ConflictException('No money to be funny');
    }

    user.balance -= +amount;

    await user.save();

    return user.balance;
  }

  async status(): Promise<{
    totalUsers: number;
    totalInvestors: number;
    totalProfit: number;
  }> {
    const usersCount = await this.userModel.find().count();
    const investorsCount = await this.userModel
      .find({ roles: Role.INVESTOR })
      .count();
    const totalProfit = await this.userModel.aggregate([
      {
        $group: {
          _id: 'totalProfit',
          count: {
            $sum: '$balance',
          },
        },
      },
    ]);

    return {
      totalUsers: usersCount,
      totalInvestors: investorsCount,
      totalProfit: totalProfit[0].count,
    };
  }

  async withdraw(data: UpdateBalanceDTO): Promise<number> {
    const { amount, id } = data;
    const investors = await this.userModel.find({
      roles: Role.INVESTOR,
      _id: { $ne: id },
    });

    const availableBalance = investors.reduce((accum, investor) => {
      return (accum += investor.balance);
    }, 0);

    if (availableBalance < amount) {
      throw new ConflictException('No money to be funny');
    }

    let remainsToWithdraw = +amount;

    for (let i = 0; i < investors.length; i++) {
      if (remainsToWithdraw === 0) {
        break;
      }

      const investor = investors[i];

      if (remainsToWithdraw >= investor.balance) {
        await this.decreaseBalance({
          amount: investor.balance,
          id: investor.id,
        });

        remainsToWithdraw -= investor.balance;
      }

      if (remainsToWithdraw < investor.balance) {
        await this.decreaseBalance({
          amount: remainsToWithdraw,
          id: investor.id,
        });

        remainsToWithdraw = 0;
      }
    }

    return await this.increaseBalance(data);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyPercent() {
    const users = await this.userModel.find({ roles: Role.INVESTOR });

    await Promise.all(
      users.map(async (user) => {
        const dailyPercent = +(user.balance * 0.01).toFixed(2);

        await this.userModel.findByIdAndUpdate(user._id.toString(), {
          balance: user.balance + dailyPercent,
          earnings: dailyPercent,
        });
      }),
    );

    const usersWithInvitations = await this.userModel.find({
      invitedUsers: { $gt: [] },
      roles: Role.INVESTOR,
    });

    usersWithInvitations.forEach(async (user) => {
      const invitedUsersEarnings = await Promise.all(
        user.invitedUsers.map(async (invitedUser) => {
          const invitedUserData = await this.userModel.findById(invitedUser);
          return invitedUserData.earnings;
        }),
      );

      const bonus =
        invitedUsersEarnings.reduce((accum, value) => {
          return accum + value;
        }, 0) * 0.1;

      await this.userModel.findByIdAndUpdate(user._id.toString(), {
        balance: user.balance + bonus,
        earnings: user.earnings + bonus,
      });
    });

    await this.userModel.updateMany({}, { $set: { earnings: 0 } });
  }
}
