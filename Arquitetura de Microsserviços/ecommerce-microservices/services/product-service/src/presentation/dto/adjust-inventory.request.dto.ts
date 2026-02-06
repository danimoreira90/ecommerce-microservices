import { IsNumber, IsString } from 'class-validator';

export class AdjustInventoryRequestDto {
  @IsNumber()
  delta: number;
}
