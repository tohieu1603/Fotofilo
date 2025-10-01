import { Module } from '@nestjs/common';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
        Address
    ])
  ],
  controllers: [AddressController],
  providers: [AddressService],  
  exports: [AddressService],   
})
export class AddressModule {}
