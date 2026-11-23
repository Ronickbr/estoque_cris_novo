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

export class CreateProductDto {
  @ApiProperty({ example: 'Galaxy S24', description: 'Nome do produto' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'uuid-do-fabricante', description: 'ID do fabricante' })
  @IsUUID()
  @IsNotEmpty()
  manufacturerId: string;

  @ApiProperty({ example: 10, description: 'Quantidade inicial em estoque', default: 0 })
  @IsInt()
  @Min(0)
  stock: number = 0;

  @ApiProperty({ example: 5, description: 'Estoque mínimo para alerta', default: 5 })
  @IsInt()
  @Min(0)
  minStock: number = 5;

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
