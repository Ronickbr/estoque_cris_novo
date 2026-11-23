import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MovementType } from '../entities/inventory-movement.entity';

export class CreateMovementDto {
  @ApiProperty({ example: 'uuid-do-produto', description: 'ID do produto' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ enum: MovementType, description: 'Tipo de movimentação' })
  @IsEnum(MovementType)
  @IsNotEmpty()
  type: MovementType;

  @ApiProperty({ example: 10, description: 'Quantidade' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Entrada de mercadoria', description: 'Observações', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}

export class CreateBatchMovementDto {
  @ApiProperty({ type: [CreateMovementDto], description: 'Lista de movimentações' })
  movements: CreateMovementDto[];
}
