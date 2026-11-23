import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 'uuid-v4-string' })
  id: string;

  @ApiProperty({ example: 'Galaxy S24' })
  name: string;

  @ApiProperty({ example: 'uuid-do-fabricante' })
  manufacturerId: string;

  @ApiProperty({ example: 'Samsung' })
  manufacturerName: string;

  @ApiProperty({ example: 'https://example.com/logo.png', nullable: true })
  manufacturerLogo: string | null;

  @ApiProperty({ example: 15 })
  stock: number;

  @ApiProperty({ example: 5 })
  minStock: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: 'ok', enum: ['ok', 'baixo', 'critico', 'zerado'] })
  stockStatus: string;

  @ApiProperty({ example: true })
  isLowStock: boolean;

  @ApiProperty({ example: false })
  isOutOfStock: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

export class PaginatedProductsResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  perPage: number;

  @ApiProperty({ example: 5 })
  lastPage: number;
}

export class LowStockProductResponseDto {
  @ApiProperty({ example: 'uuid-v4-string' })
  id: string;

  @ApiProperty({ example: 'Galaxy S24' })
  name: string;

  @ApiProperty({ example: 2 })
  stock: number;

  @ApiProperty({ example: 5 })
  minStock: number;

  @ApiProperty({ example: 'Samsung' })
  manufacturerName: string;

  @ApiProperty({ example: 'uuid-do-fabricante' })
  manufacturerId: string;

  @ApiProperty({ example: 'critico', enum: ['zerado', 'critico', 'baixo', 'ok'] })
  stockStatus: string;
}
