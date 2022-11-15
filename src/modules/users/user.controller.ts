import { Body, Controller, Patch, Post } from '@nestjs/common';
import { CreateUserDTO } from './dto/createUserDto';
import { UpdateBalanceDTO } from './dto/updateBalanceDto';
import { UsersService } from './users.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Post('sign-up')
  async signUp(@Body() body: CreateUserDTO) {
    return this.userService.create(body);
  }

  @Patch('increase-balance')
  async increaseBalance(@Body() body: UpdateBalanceDTO) {
    return this.userService.increaseBalance(body);
  }

  @Patch('decrease-balance')
  async decreaseBalance(@Body() body: UpdateBalanceDTO) {
    return this.userService.decreaseBalance(body);
  }
}
