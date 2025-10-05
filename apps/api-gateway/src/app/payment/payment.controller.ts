import { Controller, Post, Body, Get, Param, Req, UseGuards, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Param('id') id: string) {
    return this.paymentService.getPaymentById(id);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getPaymentByOrderId(@Param('orderId') orderId: string, @Req() req: any) {
    return this.paymentService.getPaymentByOrderId(orderId);
  }

  @Post('callback/momo')
  async handleMoMoCallback(@Body() body: Record<string, any>) {
    this.logger.log('Received MoMo callback at Gateway');
    return this.paymentService.handleMoMoCallback(body);
  }
}
