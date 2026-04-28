import { IsString, IsNumber, IsOptional, IsArray, Min, MinLength } from 'class-validator';

export class CreateProductRequestDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0.01)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  @MinLength(6)
  sku: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}
