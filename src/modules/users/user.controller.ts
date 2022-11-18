import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
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

  @UseGuards(JwtAuthGuard)
  @Patch('increase-balance')
  async increaseBalance(@Body() body: UpdateBalanceDTO) {
    return this.userService.increaseBalance(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('decrease-balance')
  async decreaseBalance(@Body() body: UpdateBalanceDTO) {
    return this.userService.decreaseBalance(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status() {
    return this.userService.status();
  }
}
