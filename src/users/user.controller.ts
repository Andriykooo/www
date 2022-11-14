import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @Post('sign-up')
  async signUp(@Body() body) {
    return this.userService.create(body);
  }
}
