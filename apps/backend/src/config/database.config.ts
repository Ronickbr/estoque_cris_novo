import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Manufacturer } from '../modules/manufacturers/entities/manufacturer.entity';
import { Product } from '../modules/products/entities/product.entity';
import { InventoryMovement } from '../modules/inventory-movements/entities/inventory-movement.entity';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const ssl = configService.get<boolean>('DATABASE_SSL', true);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Parse DATABASE_URL for Neon
  const url = new URL(databaseUrl);

  const options: TypeOrmModuleOptions = {
    type: 'postgres',
    host: url.hostname,
    port: parseInt(url.port || '5432', 10),
    username: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading '/'
    ssl: ssl ? { rejectUnauthorized: false } : false,
    entities: [User, Manufacturer, Product, InventoryMovement],
    synchronize: false,
    logging: configService.get<string>('LOG_LEVEL') === 'debug',
    logger: 'advanced-console',
    migrations: ['dist/database/migrations/*.js'],
    migrationsTableName: 'migrations',
    migrationsRun: true,
    extra: {
      max: 20, // Connection pool size for Neon serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
    // Neon-specific: use pooler for better serverless performance
    poolSize: 10,
  };

  return options;
};
