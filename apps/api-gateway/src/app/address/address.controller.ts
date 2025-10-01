import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UseFilters } from "@nestjs/common";
import { AddressService } from "./address.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { GrpcClientExceptionFilter } from "../common/filters/grpc-exception.filter";


@Controller('addresses')
@UseGuards(JwtAuthGuard)
@UseFilters(GrpcClientExceptionFilter)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get(':id')
  async getAddressById(@Param('id') id: string) {
    return this.addressService.getAddressById(id);
  }

  @Post()
  async createAddress(
    @Body() createAddressDto: CreateAddressDto,
    @CurrentUser() user: { id: string }
  ) {
    return this.addressService.createAddress({ ...createAddressDto, userId: user.id });
  }

  @Put(':id')
  async updateAddress(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto
  ) {
    return this.addressService.updateAddress(id, updateAddressDto);
  }

  @Delete(':id')
  async deleteAddress(@Param('id') id: string) {
    return this.addressService.deleteAddress(id);
  }

  @Get('my-addresses')
  async getMyAddresses(@CurrentUser() user: { id: string }) {
    return this.addressService.getAddressesByUserId(user.id);
  }
}
