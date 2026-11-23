import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Manufacturer } from '../../manufacturers/entities/manufacturer.entity';
import { InventoryMovement } from '../../inventory-movements/entities/inventory-movement.entity';

@Entity('products')
@Index(['manufacturerId'])
@Index(['name'])
@Index(['stock', 'minStock'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'manufacturer_id', type: 'uuid' })
  manufacturerId: string;

  @ManyToOne(() => Manufacturer, (manufacturer) => manufacturer.products, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'manufacturer_id' })
  manufacturer: Manufacturer;

  @Column({ type: 'int', unsigned: true, default: 0 })
  stock: number;

  @Column({ name: 'min_stock', type: 'int', unsigned: true, default: 5 })
  minStock: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => InventoryMovement, (movement) => movement.product)
  movements: InventoryMovement[];

  get isLowStock(): boolean {
    return this.stock <= this.minStock;
  }

  get isOutOfStock(): boolean {
    return this.stock === 0;
  }

  get stockStatus(): string {
    if (this.stock === 0) return 'zerado';
    if (this.stock <= this.minStock) return 'critico';
    if (this.stock <= this.minStock * 2) return 'baixo';
    return 'ok';
  }
}
