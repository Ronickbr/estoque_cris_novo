import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Product } from '../products/entities/product.entity';
import { Manufacturer } from '../manufacturers/entities/manufacturer.entity';
import { InventoryMovement } from '../inventory-movements/entities/inventory-movement.entity';
import { User } from '../users/entities/user.entity';
import { ProductsModule } from '../products/products.module';
import { InventoryMovementsModule } from '../inventory-movements/inventory-movements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Manufacturer, InventoryMovement, User]),
    ProductsModule,
    InventoryMovementsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
