import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { CreateUserDTO } from './dto/createUserDto';
import { CreateUserQueryDTO } from './dto/createUserQueryDto';
import { UpdateBalanceDTO } from './dto/updateBalanceDto';
import { UsersService } from './users.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Post('sign-up')
  async signUp(
    @Query() query: CreateUserQueryDTO,
    @Body() body: CreateUserDTO,
  ) {
    return this.userService.create(body, query);
  }

  @Patch('increase-balance')
  async increaseBalance(@Body() body: UpdateBalanceDTO) {
    return this.userService.increaseBalance(body);
  }

  @Patch('decrease-balance')
  async decreaseBalance(@Body() body: UpdateBalanceDTO) {
    return this.userService.decreaseBalance(body);
  }

  @Get('status')
  async status() {
    return this.userService.status();
  }
}
