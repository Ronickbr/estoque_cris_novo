import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { InventoryMovement } from '../inventory-movements/entities/inventory-movement.entity';
import { ManufacturersModule } from '../manufacturers/manufacturers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, InventoryMovement]), ManufacturersModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
