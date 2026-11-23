import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/modules/users/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'João Silva' })
  nome: string;

  @ApiProperty({ example: 'joao@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  nivel: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;
}

export class PasswordPolicyResponseDto {
  @ApiProperty({ example: 8 })
  minLength: number;

  @ApiProperty({ example: true })
  requireUppercase: boolean;

  @ApiProperty({ example: true })
  requireLowercase: boolean;

  @ApiProperty({ example: true })
  requireNumbers: boolean;

  @ApiProperty({ example: true })
  requireSymbols: boolean;
}
