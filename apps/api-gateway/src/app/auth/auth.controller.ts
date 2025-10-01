import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Query,
  UseGuards,
  HttpStatus,
  HttpException 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { 
  RegisterDto, 
  LoginDto, 
  RefreshTokenDto 
} from './dto/auth.dto';
import { Permissions } from './decorators/permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      return await this.authService.refreshToken(refreshTokenDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      return await this.authService.logout(refreshTokenDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate access token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async validateToken(@Query('token') token: string) {
    try {
      return await this.authService.validateToken(token);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('admin-action')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:create', 'user:delete')
  @ApiOperation({ summary: 'Chỉ admin hoặc user có quyền user:create và user:delete mới truy cập được' })
  async adminAction() {
    return { message: 'Bạn có quyền thực hiện thao tác admin này!' };
  }

  @Post('admin-or-manager-delete')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('manager')
  @Permissions({ resource: 'User', action: 'delete' })
  @ApiOperation({ summary: "Chỉ 'manager' có quyền 'User:delete' hoặc 'admin' mới truy cập được" })
  async adminOrManagerDelete() {
    return { message: 'Access granted for admin or manager with delete permission!' };
  }
}