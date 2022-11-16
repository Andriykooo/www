import { IsString } from 'class-validator';

export class CreateUserQueryDTO {
  @IsString()
  id: string;
}
