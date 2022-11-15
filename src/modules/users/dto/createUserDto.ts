import { IsEmail, IsNumber, IsString } from 'class-validator';

export class CreateUserDTO {
  @IsEmail()
  email: string;

  @IsString()
  role: string;

  @IsNumber()
  balance: number;

  @IsString()
  password: string;
}
