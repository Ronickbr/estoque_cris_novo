import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Email ou nome do usuário' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  identifier: string;

  @ApiProperty({ example: 'Admin@123!', description: 'Senha do usuário' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  password: string;
}
