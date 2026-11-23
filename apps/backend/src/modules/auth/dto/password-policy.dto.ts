import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({
    example: [
      'Mínimo 8 caracteres',
      'Pelo menos 1 letra maiúscula',
      'Pelo menos 1 letra minúscula',
      'Pelo menos 1 número',
      'Pelo menos 1 símbolo (!@#$%^&*)',
    ],
  })
  rules: string[];
}
