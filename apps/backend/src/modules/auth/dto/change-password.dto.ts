import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'SenhaAtual@123', description: 'Senha atual' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  senhaAtual: string;

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
