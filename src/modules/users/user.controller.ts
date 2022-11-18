import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/enums/role';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
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
  @UseGuards(JwtAuthGuard)
  async increaseBalance(@Body() body: UpdateBalanceDTO) {
    return this.userService.increaseBalance(body);
  }

  @Patch('decrease-balance')
  @Roles(Role.INVESTOR, Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async decreaseBalance(@Body() body: UpdateBalanceDTO) {
    return this.userService.decreaseBalance(body);
  }

  @Get('status')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async status() {
    return this.userService.status();
  }

  @Post('withdraw')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async withdraw() {
    return this.userService.withdraw();
  }
}
