import {
  IsArray,
  IsDate,
  IsEmail,
  IsNumber,
  IsString,
  Length,
} from 'class-validator';
import { Role } from 'src/enums/role';

export class CreateUserDTO {
  @IsEmail()
  email: string;

  @IsArray()
  @IsString({ each: true })
  roles: Role[];

  @IsArray()
  @IsString({ each: true })
  invitedUsers: string[];

  @IsNumber()
  balance: number;

  @IsNumber()
  earnings: number;

  @IsDate()
  createdAt: Date;

  @Length(1)
  password: string;
}
