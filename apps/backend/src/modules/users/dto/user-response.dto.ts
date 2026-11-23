import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'João Silva' })
  nome: string;

  @ApiProperty({ example: 'joao@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  nivel: UserRole;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  atualizadoEm: Date;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  perPage: number;

  @ApiProperty({ example: 3 })
  lastPage: number;
}
