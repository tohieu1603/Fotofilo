import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';

export interface MoMoPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData?: string;
}

export interface MoMoPaymentResponse {
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
  requestId: string;
  orderId: string;
}

@Injectable()
export class MoMoProvider {
  private readonly logger = new Logger(MoMoProvider.name);
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE') || '';
    this.accessKey = this.configService.get<string>('MOMO_ACCESS_KEY') || '';
    this.secretKey = this.configService.get<string>('MOMO_SECRET_KEY') || '';
    this.endpoint = this.configService.get<string>('MOMO_ENDPOINT') || 'https://test-payment.momo.vn/v2/gateway/api/create';
  }

  async createPayment(request: MoMoPaymentRequest): Promise<MoMoPaymentResponse> {
    const requestId = `${request.orderId}-${Date.now()}`;
    const requestType = 'captureWallet';
    const extraData = request.extraData || '';

    const rawSignature = `accessKey=${this.accessKey}&amount=${request.amount}&extraData=${extraData}&ipnUrl=${request.ipnUrl}&orderId=${request.orderId}&orderInfo=${request.orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${request.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount: request.amount,
      orderId: request.orderId,
      orderInfo: request.orderInfo,
      redirectUrl: request.redirectUrl,
      ipnUrl: request.ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    this.logger.log(`Creating MoMo payment for order ${request.orderId}`);

    try {
      const response = await axios.post(this.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.resultCode === 0) {
        this.logger.log(`MoMo payment created successfully: ${response.data.payUrl}`);
        return {
          payUrl: response.data.payUrl,
          deeplink: response.data.deeplink,
          qrCodeUrl: response.data.qrCodeUrl,
          requestId,
          orderId: request.orderId,
        };
      } else {
        throw new Error(`MoMo payment creation failed: ${response.data.message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create MoMo payment: ${error.message}`);
      throw error;
    }
  }

  verifySignature(data: Record<string, any>): boolean {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = data;

    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    return signature === expectedSignature;
  }
}
