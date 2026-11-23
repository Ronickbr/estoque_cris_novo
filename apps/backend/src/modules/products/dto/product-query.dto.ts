import { IsOptional, IsString, IsUUID, IsInt, Min, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum StockFilter {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class ProductQueryDto {
  @ApiProperty({ example: 1, description: 'Página', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiProperty({ example: 20, description: 'Itens por página', required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  perPage?: number = 20;

  @ApiProperty({ example: 'Galaxy', description: 'Buscar por nome', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    example: 'uuid-do-fabricante',
    description: 'Filtrar por fabricante',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  manufacturerId?: string;

  @ApiProperty({ enum: StockFilter, description: 'Filtrar por status de estoque', required: false })
  @IsOptional()
  @IsEnum(StockFilter)
  stock?: StockFilter;
}
