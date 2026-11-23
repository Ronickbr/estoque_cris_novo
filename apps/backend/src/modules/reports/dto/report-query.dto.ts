import { IsOptional, IsString, IsUUID, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MovementType } from '../../inventory-movements/entities/inventory-movement.entity';

export enum ReportType {
  STOCK_BY_MANUFACTURER = 'stock_by_manufacturer',
  LOW_STOCK = 'low_stock',
  MOVEMENTS = 'movements',
  PRODUCT_MOVEMENTS = 'product_movements',
  SALES_STATS = 'sales_stats',
}

export class ReportQueryDto {
  @ApiProperty({ enum: ReportType, description: 'Tipo de relatório' })
  @IsEnum(ReportType)
  type: ReportType;

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

  @ApiProperty({
    example: 'uuid-do-produto',
    description: 'ID do produto (para product_movements)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ example: 'uuid-do-fabricante', description: 'ID do fabricante', required: false })
  @IsOptional()
  @IsUUID()
  manufacturerId?: string;

  @ApiProperty({ enum: MovementType, description: 'Tipo de movimentação', required: false })
  @IsOptional()
  @IsEnum(MovementType)
  movementType?: MovementType;

  @ApiProperty({ example: '2024-01-01', description: 'Data inicial', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-01-31', description: 'Data final', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    example: 30,
    description: 'Dias para estatísticas de vendas',
    required: false,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  days?: number = 30;
}

export class ExportQueryDto {
  @ApiProperty({ enum: ReportType, description: 'Tipo de relatório para exportar' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ enum: ['xlsx', 'csv'], description: 'Formato de exportação', default: 'xlsx' })
  @IsOptional()
  @IsEnum(['xlsx', 'csv'])
  format?: 'xlsx' | 'csv' = 'xlsx';

  @ApiProperty({ example: 'uuid-do-produto', description: 'ID do produto', required: false })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ enum: MovementType, description: 'Tipo de movimentação', required: false })
  @IsOptional()
  @IsEnum(MovementType)
  movementType?: MovementType;

  @ApiProperty({ example: '2024-01-01', description: 'Data inicial', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-01-31', description: 'Data final', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
