import { IsString, IsNotEmpty, IsEmail, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeEmailDto {
  @ApiProperty({ example: 'novo@email.com', description: 'Novo email' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  novoEmail: string;

  @ApiProperty({ example: 'novo@email.com', description: 'Confirmação do novo email' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  confirmarNovoEmail: string;

  @ApiProperty({ example: 'SenhaAtual@123', description: 'Senha atual para confirmação' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  senha: string;
}
