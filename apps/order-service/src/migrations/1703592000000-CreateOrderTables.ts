import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderTables1703592000000 implements MigrationInterface {
  name = 'CreateOrderTables1703592000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')
    `);
    
    await queryRunner.query(`
      CREATE TYPE "shipping_method_enum" AS ENUM ('STANDARD', 'EXPRESS', 'OVERNIGHT')
    `);

    // Create orders table
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "order_number" character varying NOT NULL,
        "status" "order_status_enum" NOT NULL DEFAULT 'PENDING',
        "subtotal" numeric(10,2) NOT NULL,
        "tax_amount" numeric(10,2) NOT NULL,
        "shipping_amount" numeric(10,2) NOT NULL,
        "discount_amount" numeric(10,2) NOT NULL DEFAULT '0.00',
        "total_amount" numeric(10,2) NOT NULL,
        "payment_id" uuid,
        "currency" character varying(3) NOT NULL DEFAULT 'USD',
        "shipping_method" "shipping_method_enum" NOT NULL DEFAULT 'STANDARD',
        "tracking_number" character varying,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_orders_order_number" UNIQUE ("order_number"),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);

    // Create order_details table
    await queryRunner.query(`
      CREATE TABLE "order_details" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "product_name" character varying NOT NULL,
        "product_sku" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" numeric(10,2) NOT NULL,
        "discount_amount" numeric(10,2) NOT NULL DEFAULT '0.00',
        "total_amount" numeric(10,2) NOT NULL,
        "product_attributes" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_details" PRIMARY KEY ("id")
      )
    `);

    // Create shipping_addresses table
    await queryRunner.query(`
      CREATE TABLE "shipping_addresses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "full_name" character varying NOT NULL,
        "address_line_1" character varying NOT NULL,
        "address_line_2" character varying,
        "city" character varying NOT NULL,
        "state" character varying,
        "postal_code" character varying,
        "country" character varying NOT NULL,
        "phone_number" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shipping_addresses" PRIMARY KEY ("id")
      )
    `);

    // Create billing_addresses table
    await queryRunner.query(`
      CREATE TABLE "billing_addresses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "full_name" character varying NOT NULL,
        "address_line_1" character varying NOT NULL,
        "address_line_2" character varying,
        "city" character varying NOT NULL,
        "state" character varying,
        "postal_code" character varying,
        "country" character varying NOT NULL,
        "phone_number" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_billing_addresses" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_customer_id" ON "orders" ("customer_id")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_status" ON "orders" ("status")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_created_at" ON "orders" ("created_at")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_order_details_order_id" ON "order_details" ("order_id")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_order_details_product_id" ON "order_details" ("product_id")
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "order_details" 
      ADD CONSTRAINT "FK_order_details_order_id" 
      FOREIGN KEY ("order_id") REFERENCES "orders"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "shipping_addresses" 
      ADD CONSTRAINT "FK_shipping_addresses_order_id" 
      FOREIGN KEY ("order_id") REFERENCES "orders"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "billing_addresses" 
      ADD CONSTRAINT "FK_billing_addresses_order_id" 
      FOREIGN KEY ("order_id") REFERENCES "orders"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "billing_addresses" DROP CONSTRAINT "FK_billing_addresses_order_id"`);
    await queryRunner.query(`ALTER TABLE "shipping_addresses" DROP CONSTRAINT "FK_shipping_addresses_order_id"`);
    await queryRunner.query(`ALTER TABLE "order_details" DROP CONSTRAINT "FK_order_details_order_id"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_order_details_product_id"`);
    await queryRunner.query(`DROP INDEX "IDX_order_details_order_id"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_customer_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "billing_addresses"`);
    await queryRunner.query(`DROP TABLE "shipping_addresses"`);
    await queryRunner.query(`DROP TABLE "order_details"`);
    await queryRunner.query(`DROP TABLE "orders"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "shipping_method_enum"`);
    await queryRunner.query(`DROP TYPE "order_status_enum"`);
  }
}