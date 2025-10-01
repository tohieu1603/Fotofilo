import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { Metadata } from "@grpc/grpc-js";
import { firstValueFrom } from "rxjs";
import { Address } from "@nestcm/proto";

@Injectable()
export class AddressService implements OnModuleInit {
  private addressService: Address.AddressServiceClient;

  constructor(@Inject(Address.ADDRESS_PACKAGE_NAME) private client: ClientGrpc) {}

  onModuleInit() {
    this.addressService = this.client.getService<Address.AddressServiceClient>('AddressService');
  }

  private getMetadata(userId?: string) {
    const metadata = new Metadata();
    if (userId) {
      metadata.add('userId', userId); // Truyền userId xuống service qua metadata
    }
    return metadata;
  }

  async getAddressById(id: string) {
    return firstValueFrom(this.addressService.getAddress({ id }, this.getMetadata()));
  }

  async createAddress(createAddressDto: Address.CreateAddressRequest) {
    return firstValueFrom(
      this.addressService.createAddress(createAddressDto, this.getMetadata(createAddressDto.userId))
    );
  }

  async updateAddress(id: string, updateAddressDto: Omit<Address.UpdateAddressRequest, 'id'>) {
    return firstValueFrom(
      this.addressService.updateAddress({ id, ...updateAddressDto }, this.getMetadata())
    );
  }

  async deleteAddress(id: string) {
    return firstValueFrom(this.addressService.deleteAddress({ id }, this.getMetadata()));
  }

  async getAddressesByUserId(userId: string) {
    return firstValueFrom(this.addressService.listAddressesByUser({ userId }, this.getMetadata(userId)));
  }
}
