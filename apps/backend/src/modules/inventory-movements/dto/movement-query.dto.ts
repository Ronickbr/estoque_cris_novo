import { IsOptional, IsString, IsUUID, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MovementType } from '../entities/inventory-movement.entity';

export class MovementQueryDto {
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

  @ApiProperty({ example: 'uuid-do-produto', description: 'Filtrar por produto', required: false })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ enum: MovementType, description: 'Filtrar por tipo', required: false })
  @IsOptional()
  @IsEnum(MovementType)
  type?: MovementType;

  @ApiProperty({ example: 'uuid-do-usuario', description: 'Filtrar por usuário', required: false })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiProperty({ example: '2024-01-01', description: 'Data inicial', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-01-31', description: 'Data final', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
