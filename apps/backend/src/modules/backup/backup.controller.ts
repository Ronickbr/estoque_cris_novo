import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { Response } from 'express';

import { BackupService } from './backup.service';
import { BackupListResponseDto, BackupCreateResponseDto } from './dto/backup-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@ApiTags('backup')
@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class BackupController {
  constructor(private backupService: BackupService) {}

  @Get()
  @ApiOperation({ summary: 'Listar backups disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de backups', type: BackupListResponseDto })
  async listBackups(): Promise<BackupListResponseDto> {
    return this.backupService.listBackups();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo backup' })
  @ApiResponse({ status: 201, description: 'Backup criado', type: BackupCreateResponseDto })
  @ApiResponse({ status: 500, description: 'Erro ao criar backup' })
  async createBackup(): Promise<BackupCreateResponseDto> {
    return this.backupService.createBackup();
  }

  @Get(':filename/download')
  @ApiOperation({ summary: 'Download de backup' })
  @ApiResponse({ status: 200, description: 'Arquivo SQL' })
  @ApiResponse({ status: 404, description: 'Backup não encontrado' })
  @ApiParam({ name: 'filename', example: 'backup_2024-01-15_10-30-00.sql' })
  async downloadBackup(@Param('filename') filename: string, @Res() res: Response): Promise<void> {
    const { filepath, filename: sanitizedFilename } =
      await this.backupService.downloadBackup(filename);

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
    res.sendFile(filepath);
  }

  @Post(':filename/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restaurar backup' })
  @ApiResponse({ status: 200, description: 'Backup restaurado' })
  @ApiResponse({ status: 404, description: 'Backup não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro ao restaurar backup' })
  @ApiParam({ name: 'filename', example: 'backup_2024-01-15_10-30-00.sql' })
  async restoreBackup(@Param('filename') filename: string): Promise<{ message: string }> {
    return this.backupService.restoreBackup(filename);
  }

  @Delete(':filename')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir backup' })
  @ApiResponse({ status: 200, description: 'Backup excluído' })
  @ApiResponse({ status: 404, description: 'Backup não encontrado' })
  @ApiParam({ name: 'filename', example: 'backup_2024-01-15_10-30-00.sql' })
  async deleteBackup(@Param('filename') filename: string): Promise<{ message: string }> {
    return this.backupService.deleteBackup(filename);
  }

  @Post('clean')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpar backups antigos' })
  @ApiResponse({ status: 200, description: 'Backups antigos removidos' })
  async cleanBackups(): Promise<{ message: string; deleted: number }> {
    return this.backupService.cleanOldBackups();
  }
}
