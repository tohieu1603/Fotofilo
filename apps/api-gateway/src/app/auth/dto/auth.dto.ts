import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'User phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'StrongPass123!', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123!', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User roles', type: [String] })
  roles: string[];
}

export class ValidateTokenResponseDto {
  @ApiProperty({ description: 'Whether token is valid' })
  valid: boolean;

  @ApiProperty({ description: 'User ID', required: false })
  userId?: string;

  @ApiProperty({ description: 'User email', required: false })
  email?: string;
}