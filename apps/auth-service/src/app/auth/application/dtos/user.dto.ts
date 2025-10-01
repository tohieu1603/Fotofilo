import { IsString, IsEmail, IsArray, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateUserRequest, UpdateUserRequest } from "libs/proto/src/generated/auth";

export class CreateUserDto implements CreateUserRequest {

  @ApiProperty({ description: "User name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Email address" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Phone number" })
  @IsString()
  phone: string;

  @ApiProperty({ description: "Password" })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: "Role IDs", type: [String] })
  @IsArray()
  @IsString({ each: true })
  rolesId: string[] = [];
}

export class UpdateUserDto implements UpdateUserRequest {

  @ApiProperty({ description: "User ID" })
  @IsString()
  id: string;

  @ApiProperty({ description: "User name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Phone number" })
  @IsString()
  phone: string;

  @ApiProperty({ description: "Email address" })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: "Role IDs", type: [String] })
  @IsArray()
  @IsString({ each: true })
  rolesId: string[] = [];

  @ApiProperty({ description: "User active status" })
  @IsBoolean()
  isActive: boolean;
}
