import { Address } from "@nestcm/proto";
import { Controller } from "@nestjs/common";
import { AddressService } from "./address.service";

@Address.AddressServiceControllerMethods()
@Controller()
export class AddressController implements Address.AddressServiceController {
    constructor(private readonly addressService: AddressService) { }

    async createAddress(
        request: Address.CreateAddressRequest,
    ): Promise<Address.AddressResponse> {
        const addr = await this.addressService.createAddress(request);
        return {
            address: addr,
        };
    }


    async getAddress(
        request: Address.GetAddressRequest,
    ): Promise<Address.AddressResponse> {
        const addr = await this.addressService.getAddressById(request.id);
        return {
            address: addr,
        };
    }

    async listAddressesByUser(
        request: Address.ListAddressesByUserRequest,
    ): Promise<Address.ListAddressesResponse> {
        const addresses = await this.addressService.getAddressesByUserId(request.userId);
        return {
            addresses,
        }
    }

    async updateAddress(
        request: Address.UpdateAddressRequest,
    ): Promise<Address.AddressResponse> {
        const addr = await this.addressService.updateAddress(request.id, request);
        return {
            address: addr,
        }
    }

    async deleteAddress(
        request: Address.DeleteAddressRequest,
    ): Promise<void> {
        await this.addressService.deleteAddress(request.id);
    }
}
