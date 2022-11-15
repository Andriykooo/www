import { IsNumber } from 'class-validator';

export class IncreaseBalanceDTO {
  @IsNumber()
  amount: number;

  @IsNumber()
  id: number;
}
