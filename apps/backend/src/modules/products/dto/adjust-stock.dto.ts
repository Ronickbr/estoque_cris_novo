import { IsString, IsNotEmpty, IsUUID, IsInt, Min, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({ example: 'uuid-do-produto', description: 'ID do produto' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 20, description: 'Nova quantidade em estoque' })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({
    example: 'Ajuste manual após contagem',
    description: 'Observações',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
