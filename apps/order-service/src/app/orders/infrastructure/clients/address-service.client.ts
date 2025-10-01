import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Address} from '@nestcm/proto';

@Injectable()
export class AddressServiceClient implements OnModuleInit {
  private addressService: Address.AddressServiceClient;

  constructor(
    @Inject('ADDRESS_PACKAGE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.addressService = this.client.getService<Address.AddressServiceClient>('AddressService');
  }

  async getAddress(addressId: string): Promise<Address.AddressResponse> {
    const request: Address.GetAddressRequest = { id: addressId };
    return firstValueFrom(this.addressService.getAddress(request, {} as any));
  }

  async listAddressesByUser(userId: string): Promise<Address.ListAddressesResponse> {
    const request: Address.ListAddressesByUserRequest = { userId };
    return firstValueFrom(this.addressService.listAddressesByUser(request, {} as any));
  }
}