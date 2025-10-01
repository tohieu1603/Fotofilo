import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Address } from "./entities/address.entity";
import { Repository } from "typeorm";

@Injectable()
export class AddressService {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,
    ) {}

    async createAddress(addressData: Partial<Address>): Promise<Address> {
        const address = this.addressRepository.create(addressData);
        return this.addressRepository.save(address);
    }

    async getAddressesByUserId(userId: string): Promise<Address[]> {
        return this.addressRepository.find({ where: { userId } });
    }

    async getAddressById(id: string): Promise<Address> {
        return this.addressRepository.findOneOrFail({ where: { id } });
    }

    async updateAddress(id: string, updateData: Partial<Address>): Promise<Address> {
        await this.addressRepository.update(id, updateData);
        return this.addressRepository.findOneOrFail({ where: { id } });
    }

    async deleteAddress(id: string): Promise<Address> {
        const address = await this.addressRepository.findOneOrFail({ where: { id } });
        await this.addressRepository.delete(id);
        return address;
    }
}
