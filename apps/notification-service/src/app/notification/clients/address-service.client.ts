import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Address } from '@nestcm/proto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AddressServiceClient implements OnModuleInit {
  private addressService: Address.AddressServiceClient;

  constructor(@Inject('ADDRESS_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.addressService = this.client.getService<Address.AddressServiceClient>('AddressService');
  }

  async getAddressesByUserId(userId: string): Promise<Address.Address[]> {
    const request: Address.ListAddressesByUserRequest = { userId };
    const response = await firstValueFrom(this.addressService.listAddressesByUser(request, undefined));
    return response.addresses;
  }

  async getAddressById(id: string): Promise<Address.Address | null> {
    try {
      const request: Address.GetAddressRequest = { id };
      const response = await firstValueFrom(this.addressService.getAddress(request, undefined));
      return response.address || null;
    } catch (error) {
      return null;
    }
  }
}