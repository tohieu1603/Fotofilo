import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOriginalPriceToProduct1730000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'originalPrice',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
        default: null,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('products', 'originalPrice');
  }
}
