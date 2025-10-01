import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    ValidateNested,
    IsArray,
    IsOptional,
    IsInt,
    IsNumber,
    IsObject,
} from 'class-validator';

export class ItemDetailDto {
    @ApiProperty({ example: 'Áo thun nam' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Áo thun cotton thoáng mát' })
    @IsString()
    @IsNotEmpty()
    description: string; // 

    @ApiProperty({ example: 'Coolmate', required: false })
    @IsOptional()
    @IsString()
    brand: string;

    @ApiProperty({ example: 'Thời trang' })
    @IsString()
    @IsNotEmpty()
    category: string; //

    @ApiProperty({ example: 'https://example.com/ao-thun.jpg', required: false })
    @IsString()
    image: string;

    @ApiProperty({
        type: 'object',
        additionalProperties: { type: 'string' },
        example: { color: 'Đen', size: 'L' },
    })
    @IsObject()
    attributes: Record<string, string>;

    @ApiProperty({
        type: 'object',
        additionalProperties: { type: 'string' },
        example: { material: 'Cotton 100%' },
    })
    @IsObject()
    variants: Record<string, string>;
}

export class CartItemEntityDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    cartId: string;

    @ApiProperty()
    @IsString()
    skuId: string;

    @ApiProperty()
    @IsInt()
    quantity: number;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty()
    @IsString()
    image: string;

    @ApiProperty({ type: () => ItemDetailDto })
    @ValidateNested()
    @Type(() => ItemDetailDto)
    itemDetail: ItemDetailDto;

    @ApiProperty()
    @IsString()
    createdAt: string;

    @ApiProperty()
    @IsString()
    updatedAt: string;
}

export class CartEntityDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    userId: string;

    @ApiProperty({ type: [CartItemEntityDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartItemEntityDto)
    itemDetail?: CartItemEntityDto[];

    @ApiProperty()
    @IsString()
    createdAt: string;

    @ApiProperty()
    @IsString()
    updatedAt: string;
}

export class AddToCartDto {
    @ApiProperty({ description: 'User ID of the product to add to cart' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'SKU ID of the product to add to cart' })
    @IsString()
    @IsNotEmpty()
    skuId: string;

    @ApiProperty({ description: 'Quantity of the product to add to cart' })
    @IsInt()
    quantity: number;

    @ApiProperty({ description: 'Price of the product to add to cart' })
    @IsNumber()
    price: number;

    @ApiProperty({ type: ItemDetailDto, description: 'Details of the item' })
    @ValidateNested()
    @Type(() => ItemDetailDto)
    itemDetail: ItemDetailDto; // ⚠️ proto yêu cầu => bắt buộc
}

export class AddToCartResponseDto {
    @ApiProperty({ description: 'Updated cart after adding the item', type: CartEntityDto, required: false })
    @IsOptional()
    @ValidateNested()
    @Type(() => CartEntityDto)
    cart?: CartEntityDto;

    @ApiProperty({ description: 'Message' })
    @IsString()
    message: string;
}

export class GetCartDto {
    @ApiProperty({ description: 'User ID to get the cart for' })
    @IsString()
    @IsNotEmpty()
    userId: string;
}

export class GetCartResponseDto {
    @ApiProperty({ description: 'Cart for the user', type: CartEntityDto })
    @ValidateNested()
    @Type(() => CartEntityDto)
    cart: CartEntityDto;
}
export class DeleteCartDto {
    @ApiProperty({ description: 'Cart ID to delete the cart' })
    @IsString()
    @IsNotEmpty()
    cartId: string;
}

export class DeleteCartResponseDto {
    @ApiProperty({ description: 'Indicates if the cart was successfully deleted' })
    success: boolean;
}
