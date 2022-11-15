import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { UserRoles } from 'src/enums/userRoles';
import { CreateUserDTO } from './dto/createUserDto';
import { IncreaseBalanceDTO } from './dto/increaseBalanceDto';
import { User, UserDocument } from './schemas/user.shema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(RegisterDTO: CreateUserDTO) {
    const { email } = RegisterDTO;
    const user = await this.userModel.findOne({ email });

    if (user) {
      return 'User already exists';
    }

    const createdUser = new this.userModel(RegisterDTO);
    await createdUser.save();

    const { password, ...userData } = createdUser;

    return userData;
  }

  async findOne(email: string): Promise<User | undefined> {
    return this.userModel.findOne({ email });
  }

  async findById(id: number): Promise<User | undefined> {
    return this.userModel.findOne({ _id: id });
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async increaseBalance(data: IncreaseBalanceDTO): Promise<User> {
    const { amount, id } = data;

    const user = await this.findById(id);

    return this.userModel.findByIdAndUpdate(id, {
      $inc: { balance: amount },
      role: user.role === UserRoles.USER ? UserRoles.INVESTOR : user.role,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyPercent() {
    return await this.userModel.updateMany(
      { role: UserRoles.INVESTOR },
      { $mul: { balance: 1.01 } },
    );
  }
}
