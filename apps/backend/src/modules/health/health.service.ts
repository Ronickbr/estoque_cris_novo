import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as fs from 'fs';

@Injectable()
export class HealthService {
  private startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource
  ) {}

  async check() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDiskSpace(),
    ]);

    const results = checks.map((check, index) => {
      const names = ['database', 'memory', 'disk'];
      if (check.status === 'fulfilled') {
        return { [names[index]]: check.value };
      }
      return { [names[index]]: { status: 'error', message: check.reason?.message } };
    });

    const allHealthy = checks.every((c) => c.status === 'fulfilled' && c.value.status === 'ok');

    return {
      status: allHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: Object.assign({}, ...results),
    };
  }

  async ready() {
    try {
      const dbCheck = await this.checkDatabase();
      const isReady = dbCheck.status === 'ok';

      return {
        status: isReady ? 'ready' : 'not ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbCheck,
        },
      };
    } catch (error) {
      console.error('[HealthService] Ready check error:', error);
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'error', message: error.message },
        },
      };
    }
  }

  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  private async checkDatabase() {
    let ds: DataSource | null = null;
    try {
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        return { status: 'error', message: 'DATABASE_URL not configured' };
      }

      const url = new URL(databaseUrl);
      ds = new DataSource({
        type: 'postgres',
        host: url.hostname,
        port: parseInt(url.port || '5432', 10),
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        ssl: { rejectUnauthorized: false },
      });

      await ds.initialize();
      await ds.query('SELECT 1');
      await ds.destroy();
      return { status: 'ok', message: 'Database connection successful' };
    } catch (error) {
      if (ds?.isInitialized) {
        try { await ds.destroy(); } catch {}
      }
      return { status: 'error', message: error.message };
    }
  }

  private async checkMemory() {
    const used = process.memoryUsage();
    const usedMB = Math.round(used.heapUsed / 1024 / 1024);
    const totalMB = Math.round(used.heapTotal / 1024 / 1024);
    const limitMB = Math.round((used.heapTotal * 1.5) / 1024 / 1024);
    const percentage = Math.round((used.heapUsed / used.heapTotal) * 100);

    return {
      status: percentage < 90 ? 'ok' : 'warning',
      used: `${usedMB} MB`,
      total: `${totalMB} MB`,
      limit: `${limitMB} MB`,
      percentage: `${percentage}%`,
    };
  }

  private async checkDiskSpace() {
    try {
      const stats = fs.statSync('.');
      return { status: 'ok', message: 'Disk accessible' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}