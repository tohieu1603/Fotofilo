import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Attribute } from './attribute.entity';
import { SkuAttributeOption } from './sku-attribute-option.entity';

@Entity('attribute_options')
export class AttributeOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  attributeId: string;

  @Column()
  value: string;

  @ManyToOne(() => Attribute, (attr) => attr.options)
  attribute: Attribute;

  @OneToMany(() => SkuAttributeOption, (skuOption) => skuOption.attributeOption)
  skuOptions: SkuAttributeOption[];
}
