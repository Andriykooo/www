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
    user.balance += amount;
    user.roles.push(Role.INVESTOR);

    await user.save();

    return user.balance;
  }

  async decreaseBalance(data: UpdateBalanceDTO): Promise<number> {
    const { amount, id } = data;
    const user = await this.userModel.findById(id);

    if (user.balance < amount) {
      throw new ConflictException('No money to be funny');
    }

    user.balance -= amount;

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

  async withdraw(): Promise<any> {
    return '';
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyPercent() {
    return await this.userModel.updateMany(
      { roles: Role.INVESTOR },
      { $mul: { balance: 1.01 } },
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyPercentFromInvitedUsers() {
    const usersWithInvitations = await this.userModel.find({
      invitedUsers: { $gt: [] },
    });

    usersWithInvitations.forEach(async (user) => {
      const invitedUsersBalance = await Promise.all(
        user.invitedUsers.map(async (invitedUser) => {
          const invitedUserData = await this.userModel.findById(invitedUser);
          return invitedUserData.balance;
        }),
      );

      const userBonus =
        invitedUsersBalance.reduce((accum, value) => {
          return accum + value;
        }, 0) * 0.1;

      await this.userModel.findByIdAndUpdate(user._id.toString(), {
        $inc: { balance: userBonus },
      });
    });
  }
}
