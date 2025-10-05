import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, ValidateNested, IsArray, ArrayNotEmpty, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Order } from '@nestcm/proto';

export class MoneyDto {
  @ApiProperty({ example: 99.99, description: 'Amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'USD', description: 'Currency code (ISO 4217)' })
  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class AddressDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ obj }) => obj.fullName || obj.full_name)
  fullName: string;

  @ApiProperty({ example: '123 Main Street', description: 'Address line 1' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ obj }) => obj.addressLine1 || obj.address_line_1)
  addressLine1: string;

  @ApiProperty({ example: 'Apt 4B', description: 'Address line 2', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ obj }) => obj.addressLine2 || obj.address_line_2)
  addressLine2?: string;

  @ApiProperty({ example: 'New York', description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'NY', description: 'State' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '10001', description: 'Postal code' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ obj }) => obj.postalCode || obj.postal_code)
  postalCode: string;

  @ApiProperty({ example: 'USA', description: 'Country' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: '+1-555-123-4567', description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ obj }) => obj.phoneNumber || obj.phone_number)
  phoneNumber?: string;
}

export class OrderItemDto {
  @ApiProperty({ example: 'prod_123', description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'sku_456', description: 'SKU ID' })
  @IsString()
  @IsNotEmpty()
  skuId: string;

  @ApiProperty({ example: 'SKU-ABC-123', description: 'SKU code' })
  @IsString()
  @IsNotEmpty()
  skuCode: string;

  @ApiProperty({ example: '2', description: 'Quantity as string' })
  @IsString()
  @IsNotEmpty()
  quantity: string;

  @ApiProperty({ type: MoneyDto, description: 'Unit price' })
  @ValidateNested()
  @Type(() => MoneyDto)
  unitPrice: MoneyDto;

  @ApiProperty({ type: MoneyDto, description: 'Discount amount', required: false })
  @ValidateNested()
  @Type(() => MoneyDto)
  @IsOptional()
  discountAmount?: MoneyDto;

  @ApiProperty({ type: MoneyDto, description: 'Total amount' })
  @ValidateNested()
  @Type(() => MoneyDto)
  totalAmount: MoneyDto;
}


export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto], description: 'Order items' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 'addr_123', description: 'Shipping address ID' })
  @IsString()
  @IsNotEmpty()
  shippingAddressId: string;

  @ApiProperty({ example: 'addr_456', description: 'Billing address ID', required: false })
  @IsString()
  @IsOptional()
  billingAddressId?: string;

  @ApiProperty({
    type: 'number',
    enum: [0, 1, 2, 3, -1],
    example: 1,
    description: 'Shipping method (0=UNSPECIFIED, 1=STANDARD, 2=EXPRESS, 3=OVERNIGHT, -1=UNRECOGNIZED)'
  })
  @IsIn([0, 1, 2, 3, -1])
  @Transform(({ obj }) => obj.shippingMethod || obj.shipping_method)
  shippingMethod: number;

  @ApiProperty({ example: 'Please handle with care', description: 'Order notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: MoneyDto, description: 'Discount amount', required: false })
  @ValidateNested()
  @Type(() => MoneyDto)
  @IsOptional()
  discountAmount?: MoneyDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ example: 'USD', description: 'Currency code' })
  @IsString()
  @IsNotEmpty()
  currency: string;
}