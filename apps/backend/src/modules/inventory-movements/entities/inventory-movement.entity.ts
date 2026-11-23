import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export enum MovementType {
  ENTRY = 'entrada',
  EXIT = 'saida',
}

@Entity('inventory_movements')
@Index(['productId'])
@Index(['type'])
@Index(['createdAt'])
@Index(['createdBy'])
@Index(['productId', 'createdAt'])
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.movements, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  type: MovementType;

  @Column({ type: 'int', unsigned: true })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'created_by', type: 'int' })
  createdBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  get isEntry(): boolean {
    return this.type === MovementType.ENTRY;
  }

  get isExit(): boolean {
    return this.type === MovementType.EXIT;
  }
}
