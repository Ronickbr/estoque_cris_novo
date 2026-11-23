import { ApiProperty } from '@nestjs/swagger';
import { MovementType } from '../entities/inventory-movement.entity';

export class MovementResponseDto {
  @ApiProperty({ example: 'uuid-v4-string' })
  id: string;

  @ApiProperty({ example: 'uuid-do-produto' })
  productId: string;

  @ApiProperty({ example: 'Galaxy S24' })
  productName: string;

  @ApiProperty({ enum: MovementType, example: MovementType.ENTRY })
  type: MovementType;

  @ApiProperty({ example: 10 })
  quantity: number;

  @ApiProperty({ example: 'Entrada de mercadoria', nullable: true })
  notes: string | null;

  @ApiProperty({ example: 1 })
  createdBy: number;

  @ApiProperty({ example: 'João Silva' })
  createdByName: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}

export class PaginatedMovementsResponseDto {
  @ApiProperty({ type: [MovementResponseDto] })
  data: MovementResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  perPage: number;

  @ApiProperty({ example: 5 })
  lastPage: number;
}

export class SalesStatsResponseDto {
  @ApiProperty({ example: 150 })
  totalExits: number;

  @ApiProperty({ example: 1250 })
  totalQuantityExited: number;

  @ApiProperty({ example: 50 })
  totalEntries: number;

  @ApiProperty({ example: 1000 })
  totalQuantityEntered: number;

  @ApiProperty({ example: 250 })
  netQuantity: number;
}
