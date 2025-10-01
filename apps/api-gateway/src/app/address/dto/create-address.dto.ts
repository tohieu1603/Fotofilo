import { IsString, IsNotEmpty, IsEmail } from "class-validator";

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  ward: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  userId?: string;
}
