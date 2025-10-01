import { IsString, IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { LoginRequest } from "libs/proto/src/generated/auth";

export class LoginDto implements LoginRequest {

  @ApiProperty({
    description: "Email address",
    example: "john.doe@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Password",
    example: "SecurePass123!",
  })
  @IsString()
  password: string;
}
