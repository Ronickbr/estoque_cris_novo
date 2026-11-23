import { IsString, IsNotEmpty, MinLength, MaxLength, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome do usuário' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  nome: string;

  @ApiProperty({ example: 'joao@example.com', description: 'Email do usuário' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha (mín. 8 caracteres, maiúscula, minúscula, número, símbolo)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  senha: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER, description: 'Nível de acesso' })
  @IsEnum(UserRole)
  nivel: UserRole = UserRole.USER;
}
