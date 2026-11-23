import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ManufacturersModule } from './modules/manufacturers/manufacturers.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryMovementsModule } from './modules/inventory-movements/inventory-movements.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BackupModule } from './modules/backup/backup.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';

import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Database (TypeORM with Neon PostgreSQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // JWT Authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: jwtConfig,
      inject: [ConfigService],
      global: true,
    }),

    // Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Feature modules
    AuthModule,
    UsersModule,
    ManufacturersModule,
    ProductsModule,
    InventoryMovementsModule,
    ReportsModule,
    BackupModule,
    UploadsModule,
    HealthModule,
  ],
})
export class AppModule {}
