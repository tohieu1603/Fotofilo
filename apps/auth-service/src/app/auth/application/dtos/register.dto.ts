import { IsString, IsEmail, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RegisterRequest } from "libs/proto/src/generated/auth";

export class RegisterDto implements RegisterRequest {
 

  @ApiProperty({
    description: "Full name of the user",
    example: "John Doe",
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: "Email address",
    example: "john.doe@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Phone number",
    example: "+84987654321",
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: "Password (min 8 characters)",
    example: "SecurePass123!",
  })
  @IsString()
  @MinLength(8)
  password: string;
}
