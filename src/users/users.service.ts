import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDTO } from './dto/createUserDto';
import { User, UserDocument } from './schemas/user.shema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(RegisterDTO: CreateUserDTO) {
    const { email } = RegisterDTO;
    const user = await this.userModel.findOne({ email });

    if (user) {
      return 'user already exists';
    }

    const createdUser = new this.userModel(RegisterDTO);
    await createdUser.save();

    const { password, ...userData } = createdUser;

    return userData;
  }

  async findOne(email: string): Promise<User | undefined> {
    return this.userModel.findOne({ email });
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
