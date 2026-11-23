import { ApiProperty } from '@nestjs/swagger';

export class ManufacturerResponseDto {
  @ApiProperty({ example: 'uuid-v4-string' })
  id: string;

  @ApiProperty({ example: 'Samsung' })
  name: string;

  @ApiProperty({ example: 'https://example.com/logo.png', nullable: true })
  logoUrl: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 10, required: false })
  productCount?: number;

  @ApiProperty({ example: 150, required: false })
  totalStock?: number;
}

export class PaginatedManufacturersResponseDto {
  @ApiProperty({ type: [ManufacturerResponseDto] })
  data: ManufacturerResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  perPage: number;

  @ApiProperty({ example: 3 })
  lastPage: number;
}

export class ManufacturerSelectDto {
  @ApiProperty({ example: 'uuid-v4-string' })
  id: string;

  @ApiProperty({ example: 'Samsung' })
  name: string;
}
