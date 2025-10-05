import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Auth, Cart, resolveProtoPaths, Product, Brand, Category, Order, Address } from '@nestcm/proto';
import { ProductController } from './products/product.controller';
import { ProductService } from './products/product.service';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { CartService } from './cart/cart.service';
import { AuthController } from './auth/auth.controller';
import { CartController } from './cart/cart.controller';
import { BrandController } from './brand/brand.controller';
import { BrandService } from './brand/brand.service';
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';
import { ProductMapperService } from './products/mappers';
import { CartMapperService } from './cart/mappers';
import { AddressController } from './address/address.controller';
import { AddressService } from './address/address.service';
import { InventoryModule } from './inventory/inventory.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';

const Controllers = [
  ProductController,
  AuthController,
  CartController,
  BrandController,
  CategoryController,
  OrderController,
  AddressController,
  PaymentController
];

const Services = [
  ProductService,
  AuthService,
  CartService,
  BrandService,
  CategoryService,
  OrderService,
  ProductMapperService,
  CartMapperService,
  AddressService,
  PaymentService
];

@Module({
  imports: [
    ClientsModule.register([
      {
        name: Product.PRODUCT_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.PRODUCT_SERVICE_GRPC_URL || 'localhost:50051',
          package: 'product',
          protoPath: resolveProtoPaths([
            'proto/product.proto',
            'proto/brand.proto',
            'proto/category.proto',
          ]),
        },
      },
      {
        name: Brand.BRAND_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.PRODUCT_SERVICE_GRPC_URL || 'localhost:50051',
          package: 'brand',
          protoPath: resolveProtoPaths(['proto/brand.proto']),
        },
      },
      {
        name: Category.CATEGORY_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.PRODUCT_SERVICE_GRPC_URL || 'localhost:50051',
          package: 'category',
          protoPath: resolveProtoPaths(['proto/category.proto']),
        },
      },
      {
        name: Order.ORDER_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.ORDER_SERVICE_GRPC_URL || 'localhost:50054',
          package: 'order',
          protoPath: resolveProtoPaths(['proto/order.proto']),
        },
      },
      {
        name: Auth.AUTH_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: resolveProtoPaths(['proto/auth.proto']),
          url: process.env.AUTH_GRPC_URL || 'localhost:50052',
        },
      },
      {
        name: Address.ADDRESS_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: 'address',
          protoPath: resolveProtoPaths(['proto/address.proto']),
          url: process.env.ADDRESS_GRPC_URL || 'localhost:50052',
        },
      },
      {
        name: Cart.CART_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: 'cart',
          protoPath: resolveProtoPaths(['proto/cart.proto']),
          url: process.env.CART_GRPC_URL || 'localhost:50053',
        },
      },
      {
        name: 'PAYMENT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'payment',
          protoPath: resolveProtoPaths(['proto/payment.proto']),
          url: process.env.PAYMENT_GRPC_URL || 'localhost:50059',
        },
      }
    ]),
    AuthModule,
    InventoryModule,
    RecommendationsModule,
  ],
  controllers: [...Controllers],
  providers: [
    ...Services
  ],
})
export class AppModule { }
