import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateManufacturerDto {
  @ApiProperty({ example: 'Samsung', description: 'Nome do fabricante', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'URL do logo',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(2000)
  logoUrl?: string;
}
