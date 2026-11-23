import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome do usuário', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  nome?: string;

  @ApiProperty({ example: 'joao@example.com', description: 'Email do usuário', required: false })
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ enum: UserRole, description: 'Nível de acesso', required: false })
  @IsEnum(UserRole)
  @IsOptional()
  nivel?: UserRole;
}
