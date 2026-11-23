import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiProperty({ example: 'Galaxy S24', description: 'Nome do produto', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ example: 'uuid-do-fabricante', description: 'ID do fabricante', required: false })
  @IsUUID()
  @IsOptional()
  manufacturerId?: string;

  @ApiProperty({ example: 15, description: 'Quantidade em estoque', required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: 5, description: 'Estoque mínimo para alerta', required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  minStock?: number;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL da imagem',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  imageUrl?: string;
}
