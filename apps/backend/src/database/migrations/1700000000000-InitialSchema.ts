import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, View } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create usuarios table
    await queryRunner.createTable(
      new Table({
        name: 'usuarios',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'senha',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'nivel',
            type: 'enum',
            enum: ['admin', 'usuario'],
            default: "'usuario'",
            isNullable: false,
          },
          {
            name: 'token_reset',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'token_expiracao',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'criado_em',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'atualizado_em',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create unique indexes for usuarios
    await queryRunner.createIndex(
      'usuarios',
      new TableIndex({ name: 'uk_usuarios_email', columnNames: ['email'], isUnique: true })
    );
    await queryRunner.createIndex(
      'usuarios',
      new TableIndex({ name: 'uk_usuarios_nome', columnNames: ['nome'], isUnique: true })
    );
    await queryRunner.createIndex(
      'usuarios',
      new TableIndex({ name: 'idx_usuarios_nivel', columnNames: ['nivel'] })
    );

    // Create manufacturers table
    await queryRunner.createTable(
      new Table({
        name: 'manufacturers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'logo_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create unique index for manufacturers
    await queryRunner.createIndex(
      'manufacturers',
      new TableIndex({ name: 'uk_manufacturers_name', columnNames: ['name'], isUnique: true })
    );
    await queryRunner.createIndex(
      'manufacturers',
      new TableIndex({ name: 'idx_manufacturers_name', columnNames: ['name'] })
    );

    // Create products table
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'manufacturer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'stock',
            type: 'int',
            unsigned: true,
            default: 0,
            isNullable: false,
          },
          {
            name: 'min_stock',
            type: 'int',
            unsigned: true,
            default: 5,
            isNullable: false,
          },
          {
            name: 'image_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: true,
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create foreign key for products.manufacturer_id
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        name: 'fk_products_manufacturer_id',
        columnNames: ['manufacturer_id'],
        referencedTableName: 'manufacturers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
    );

    // Create indexes for products
    await queryRunner.createIndex(
      'products',
      new TableIndex({ name: 'idx_products_manufacturer_id', columnNames: ['manufacturer_id'] })
    );
    await queryRunner.createIndex(
      'products',
      new TableIndex({ name: 'idx_products_name', columnNames: ['name'] })
    );
    await queryRunner.createIndex(
      'products',
      new TableIndex({ name: 'idx_products_stock', columnNames: ['stock', 'min_stock'] })
    );

    // Create inventory_movements table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_movements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['entrada', 'saida'],
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'int',
            unsigned: true,
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'int',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create foreign keys for inventory_movements
    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        name: 'fk_inventory_movements_product_id',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        name: 'fk_inventory_movements_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
    );

    // Create indexes for inventory_movements
    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({ name: 'idx_inventory_movements_product_id', columnNames: ['product_id'] })
    );
    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({ name: 'idx_inventory_movements_type', columnNames: ['type'] })
    );
    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({ name: 'idx_inventory_movements_created_at', columnNames: ['created_at'] })
    );
    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({ name: 'idx_inventory_movements_created_by', columnNames: ['created_by'] })
    );
    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({
        name: 'idx_inventory_movements_product_created',
        columnNames: ['product_id', 'created_at'],
      })
    );

    // Create views for reports
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_stock_by_manufacturer AS
      SELECT 
        m.id as manufacturer_id,
        m.name as manufacturer_name,
        COUNT(p.id) as total_products,
        COALESCE(SUM(p.stock), 0) as total_stock,
        SUM(CASE WHEN p.stock <= p.min_stock THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN p.stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM manufacturers m
      LEFT JOIN products p ON m.id = p.manufacturer_id
      GROUP BY m.id, m.name;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_low_stock_products AS
      SELECT 
        p.id,
        p.name,
        p.stock,
        p.min_stock,
        m.name as manufacturer_name,
        m.id as manufacturer_id,
        CASE 
          WHEN p.stock = 0 THEN 'zerado'
          WHEN p.stock <= p.min_stock THEN 'critico'
          WHEN p.stock <= (p.min_stock * 2) THEN 'baixo'
          ELSE 'ok'
        END as stock_status
      FROM products p
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.stock <= COALESCE(p.min_stock, 5)
      ORDER BY m.name, p.stock;
    `);

    // Create trigger function for inventory movement validation
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION validate_inventory_movement()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Validate type
        IF NEW.type NOT IN ('entrada', 'saida') THEN
          RAISE EXCEPTION 'Valor de tipo inválido. Deve ser entrada ou saida.';
        END IF;

        -- Validate quantity
        IF NEW.quantity <= 0 THEN
          RAISE EXCEPTION 'Quantidade deve ser maior que zero.';
        END IF;

        -- Check stock for exits
        IF NEW.type = 'saida' THEN
          DECLARE
            current_stock INTEGER;
          BEGIN
            SELECT COALESCE(stock, 0) INTO current_stock
            FROM products 
            WHERE id = NEW.product_id
            FOR UPDATE;
            
            IF current_stock < NEW.quantity THEN
              RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', current_stock, NEW.quantity;
            END IF;
          END;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_inventory_movements_validation ON inventory_movements;
      CREATE TRIGGER trg_inventory_movements_validation
      BEFORE INSERT ON inventory_movements
      FOR EACH ROW
      EXECUTE FUNCTION validate_inventory_movement();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS trg_inventory_movements_validation ON inventory_movements'
    );
    await queryRunner.query('DROP FUNCTION IF EXISTS validate_inventory_movement');

    // Drop views
    await queryRunner.query('DROP VIEW IF EXISTS v_low_stock_products');
    await queryRunner.query('DROP VIEW IF EXISTS v_stock_by_manufacturer');

    // Drop tables in reverse order
    await queryRunner.dropTable('inventory_movements');
    await queryRunner.dropTable('products');
    await queryRunner.dropTable('manufacturers');
    await queryRunner.dropTable('usuarios');
  }
}
