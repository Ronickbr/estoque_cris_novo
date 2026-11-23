import { IsString, IsNotEmpty, MinLength, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'usuario@example.com', description: 'Email do usuário' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'token-gerado-pelo-sistema',
    description: 'Token de reset recebido por email',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  token: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Nova senha (mín. 8 caracteres, maiúscula, minúscula, número, símbolo)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  novaSenha: string;

  @ApiProperty({ example: 'NovaSenha@123', description: 'Confirmação da nova senha' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  confirmarNovaSenha: string;
}
