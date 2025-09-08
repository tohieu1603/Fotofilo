import { Entity, PrimaryColumn, ManyToOne } from 'typeorm';
import { Sku } from './sku.entity';
import { AttributeOption } from './attribute-option.entity';

@Entity('sku_attribute_options')
export class SkuAttributeOption {
  @PrimaryColumn()
  skuId: string;

  @PrimaryColumn()
  attributeOptionId: string;

  @ManyToOne(() => Sku, (sku) => sku.skuOptions)
  sku: Sku;

  @ManyToOne(() => AttributeOption, (option) => option.skuOptions)
  attributeOption: AttributeOption;
}
