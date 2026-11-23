import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

const configService = new ConfigService();

const databaseUrl = configService.get<string>('DATABASE_URL');
const ssl = configService.get<boolean>('DATABASE_SSL', true);

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const url = new URL(databaseUrl);

const options: DataSourceOptions = {
  type: 'postgres',
  host: url.hostname,
  port: parseInt(url.port || '5432', 10),
  username: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: ssl ? { rejectUnauthorized: false } : false,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: false,
};

export const AppDataSource = new DataSource(options);
