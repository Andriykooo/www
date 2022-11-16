import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { UserRoles } from 'src/enums/userRoles';
import { CreateUserDTO } from './dto/createUserDto';
import { UpdateBalanceDTO } from './dto/updateBalanceDto';
import { User, UserDocument } from './schemas/user.shema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(RegisterDTO: CreateUserDTO, { id }) {
    const { email } = RegisterDTO;
    const user = await this.userModel.findOne({ email });

    if (user) {
      throw new ConflictException('User already exists');
    }

    const createdUser = new this.userModel(RegisterDTO);
    await createdUser.save();

    const referalUser = await this.userModel.findById(id);
    referalUser.invitedUsers.push(id);
    await referalUser.save();

    const { password, ...userData } = createdUser;

    return userData;
  }

  async findOne(email: string): Promise<User | undefined> {
    return this.userModel.findOne({ email });
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async increaseBalance(data: UpdateBalanceDTO): Promise<number> {
    const { amount, id } = data;
    const user = await this.userModel.findById(id);
    user.balance += amount;
    user.role = user.role === UserRoles.USER ? UserRoles.INVESTOR : user.role;

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

  async status(): Promise<any> {
    const usersCount = await this.userModel.find().count();
    const investorsCount = await this.userModel
      .find({ role: UserRoles.INVESTOR })
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyPercent() {
    return await this.userModel.updateMany(
      { role: [UserRoles.INVESTOR, UserRoles.ADMIN] },
      { $mul: { balance: 1.01 } },
    );
  }
}
