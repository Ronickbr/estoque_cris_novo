import { ApiProperty } from '@nestjs/swagger';

export class BackupFileDto {
  @ApiProperty({ example: 'backup_2024-01-15_10-30-00.sql' })
  filename: string;

  @ApiProperty({ example: 1024567 })
  size: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}

export class BackupListResponseDto {
  @ApiProperty({ type: [BackupFileDto] })
  backups: BackupFileDto[];

  @ApiProperty({ example: 5 })
  total: number;
}

export class BackupCreateResponseDto {
  @ApiProperty({ example: 'backup_2024-01-15_10-30-00.sql' })
  filename: string;

  @ApiProperty({ example: 1024567 })
  size: number;

  @ApiProperty({ example: 'Backup criado com sucesso!' })
  message: string;
}
