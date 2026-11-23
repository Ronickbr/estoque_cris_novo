import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

import {
  BackupFileDto,
  BackupListResponseDto,
  BackupCreateResponseDto,
} from './dto/backup-response.dto';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private backupDir: string;
  private maxBackups: number;

  constructor(
    private configService: ConfigService,
    private dataSource: DataSource
  ) {
    this.backupDir = this.configService.get<string>('BACKUP_DIR', './backups');
    this.maxBackups = this.configService.get<number>('BACKUP_MAX_FILES', 30);

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(): Promise<BackupCreateResponseDto> {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new InternalServerErrorException('DATABASE_URL não configurada');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      // Use pg_dump for PostgreSQL backup
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;
      const database = url.pathname.slice(1);

      // Set PGPASSWORD environment variable for pg_dump
      const env = { ...process.env, PGPASSWORD: password };

      const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-owner --no-privileges --clean --if-exists > "${filepath}"`;

      await execAsync(command, { env });

      const stats = fs.statSync(filepath);

      // Clean old backups
      await this.cleanOldBackups();

      return {
        filename,
        size: stats.size,
        message: 'Backup criado com sucesso!',
      };
    } catch (error) {
      // Clean up failed backup file
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      throw new InternalServerErrorException(`Erro ao criar backup: ${error.message}`);
    }
  }

  async listBackups(): Promise<BackupListResponseDto> {
    const files = fs
      .readdirSync(this.backupDir)
      .filter((file) => file.endsWith('.sql'))
      .map((filename) => {
        const filepath = path.join(this.backupDir, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      backups: files,
      total: files.length,
    };
  }

  async downloadBackup(filename: string): Promise<{ filepath: string; filename: string }> {
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    if (!sanitizedFilename.endsWith('.sql')) {
      throw new BadRequestException('Formato de arquivo inválido');
    }

    const filepath = path.join(this.backupDir, sanitizedFilename);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Backup não encontrado');
    }

    return { filepath, filename: sanitizedFilename };
  }

  async restoreBackup(filename: string): Promise<{ message: string }> {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new InternalServerErrorException('DATABASE_URL não configurada');
    }

    // Sanitize filename
    const sanitizedFilename = path.basename(filename);
    if (!sanitizedFilename.endsWith('.sql')) {
      throw new BadRequestException('Formato de arquivo inválido');
    }

    const filepath = path.join(this.backupDir, sanitizedFilename);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Backup não encontrado');
    }

    try {
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;
      const database = url.pathname.slice(1);

      const env = { ...process.env, PGPASSWORD: password };

      // Use psql to restore
      const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${filepath}"`;

      await execAsync(command, { env });

      return { message: 'Backup restaurado com sucesso!' };
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao restaurar backup: ${error.message}`);
    }
  }

  async deleteBackup(filename: string): Promise<{ message: string }> {
    const sanitizedFilename = path.basename(filename);
    if (!sanitizedFilename.endsWith('.sql')) {
      throw new BadRequestException('Formato de arquivo inválido');
    }

    const filepath = path.join(this.backupDir, sanitizedFilename);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Backup não encontrado');
    }

    fs.unlinkSync(filepath);

    return { message: 'Backup excluído com sucesso!' };
  }

  async cleanOldBackups(): Promise<{ message: string; deleted: number }> {
    const files = fs
      .readdirSync(this.backupDir)
      .filter((file) => file.endsWith('.sql'))
      .map((filename) => {
        const filepath = path.join(this.backupDir, filename);
        const stats = fs.statSync(filepath);
        return { filename, filepath, mtime: stats.mtime };
      })
      .sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    let deleted = 0;

    while (files.length > this.maxBackups) {
      const oldest = files.shift()!;
      fs.unlinkSync(oldest.filepath);
      deleted++;
    }

    return { message: `${deleted} backup(s) antigo(s) removido(s)`, deleted };
  }
}
