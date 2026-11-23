import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'usuario',
}

@Entity('usuarios')
@Index(['email'], { unique: true })
@Index(['nome'], { unique: true })
@Index(['nivel'])
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ length: 100 })
  email: string;

  @Column({ name: 'senha', length: 255 })
  @Exclude({ toPlainOnly: true })
  senha: string;

  @Column({
    name: 'nivel',
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  nivel: UserRole;

  @Column({ name: 'token_reset', type: 'varchar', length: 255, nullable: true })
  @Exclude({ toPlainOnly: true })
  tokenReset: string | null;

  @Column({ name: 'token_expiracao', type: 'timestamp', nullable: true })
  @Exclude({ toPlainOnly: true })
  tokenExpiracao: Date | null;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.senha && !this.senha.startsWith('$2b$')) {
      this.senha = await bcrypt.hash(this.senha, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.senha);
  }

  toJSON(): Partial<User> {
    const { senha, tokenReset, tokenExpiracao, ...result } = this;
    return result;
  }
}
