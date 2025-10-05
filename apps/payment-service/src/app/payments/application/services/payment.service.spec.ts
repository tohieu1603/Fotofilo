import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { Payment, PaymentMethod, PaymentStatus } from '../../domain/entities/payment.entity';
import { MoMoProvider } from '../../infrastructure/providers/momo.provider';
import { KafkaProducer } from '../../infrastructure/kafka/kafka.producer';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: Repository<Payment>;
  let momoProvider: MoMoProvider;
  let kafkaProducer: KafkaProducer;

  const mockPaymentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMoMoProvider = {
    createPayment: jest.fn(),
    verifySignature: jest.fn(),
  };

  const mockKafkaProducer = {
    sendPaymentSuccessEvent: jest.fn(),
    sendPaymentFailedEvent: jest.fn(),
    sendPaymentPendingEvent: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        PAYMENT_REDIRECT_URL: 'http://localhost:3000/payment/result',
        PAYMENT_IPN_URL: 'http://localhost:3001/payments/callback/momo',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: MoMoProvider,
          useValue: mockMoMoProvider,
        },
        {
          provide: KafkaProducer,
          useValue: mockKafkaProducer,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    momoProvider = module.get<MoMoProvider>(MoMoProvider);
    kafkaProducer = module.get<KafkaProducer>(KafkaProducer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create COD payment successfully', async () => {
      const dto = {
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 100000,
        currency: 'VND',
        paymentMethod: PaymentMethod.COD,
        orderInfo: 'Test order',
      };

      const mockPayment = {
        id: 'payment-123',
        ...dto,
        amount: '100000',
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      const result = await service.createPayment(dto);

      expect(result).toEqual(mockPayment);
      expect(mockPaymentRepository.create).toHaveBeenCalledWith({
        orderId: dto.orderId,
        customerId: dto.customerId,
        amount: dto.amount.toString(),
        currency: dto.currency,
        paymentMethod: dto.paymentMethod,
        status: PaymentStatus.PENDING,
      });
      expect(mockKafkaProducer.sendPaymentPendingEvent).toHaveBeenCalled();
    });

    it('should create MoMo payment with payment URL', async () => {
      const dto = {
        orderId: 'order-123',
        customerId: 'customer-123',
        amount: 100000,
        currency: 'VND',
        paymentMethod: PaymentMethod.MOMO,
        orderInfo: 'Test order',
      };

      const mockPayment = {
        id: 'payment-123',
        ...dto,
        amount: '100000',
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMoMoResponse = {
        payUrl: 'https://test-payment.momo.vn/pay/xxx',
        requestId: 'req-123',
        orderId: dto.orderId,
      };

      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        paymentUrl: mockMoMoResponse.payUrl,
        transactionId: mockMoMoResponse.requestId,
        status: PaymentStatus.PROCESSING,
      });
      mockMoMoProvider.createPayment.mockResolvedValue(mockMoMoResponse);

      const result = await service.createPayment(dto);

      expect(result.paymentUrl).toBe(mockMoMoResponse.payUrl);
      expect(result.status).toBe(PaymentStatus.PROCESSING);
      expect(mockMoMoProvider.createPayment).toHaveBeenCalled();
      expect(mockKafkaProducer.sendPaymentPendingEvent).toHaveBeenCalled();
    });
  });

  describe('handleMoMoCallback', () => {
    it('should handle successful payment callback', async () => {
      const callbackData = {
        orderId: 'order-123',
        transId: 'trans-123',
        resultCode: 0,
        message: 'Success',
        signature: 'valid-signature',
      };

      const mockPayment = {
        id: 'payment-123',
        orderId: callbackData.orderId,
        amount: '100000',
        status: PaymentStatus.PROCESSING,
      };

      mockMoMoProvider.verifySignature.mockReturnValue(true);
      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.SUCCESS,
        transactionId: callbackData.transId,
        paidAt: new Date(),
      });

      await service.handleMoMoCallback(callbackData);

      expect(mockMoMoProvider.verifySignature).toHaveBeenCalledWith(callbackData);
      expect(mockKafkaProducer.sendPaymentSuccessEvent).toHaveBeenCalled();
    });

    it('should handle failed payment callback', async () => {
      const callbackData = {
        orderId: 'order-123',
        transId: 'trans-123',
        resultCode: 1,
        message: 'Payment failed',
        signature: 'valid-signature',
      };

      const mockPayment = {
        id: 'payment-123',
        orderId: callbackData.orderId,
        amount: '100000',
        status: PaymentStatus.PROCESSING,
      };

      mockMoMoProvider.verifySignature.mockReturnValue(true);
      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
        failureReason: callbackData.message,
      });

      await service.handleMoMoCallback(callbackData);

      expect(mockKafkaProducer.sendPaymentFailedEvent).toHaveBeenCalled();
    });

    it('should throw error for invalid signature', async () => {
      const callbackData = {
        orderId: 'order-123',
        signature: 'invalid-signature',
      };

      mockMoMoProvider.verifySignature.mockReturnValue(false);

      await expect(service.handleMoMoCallback(callbackData)).rejects.toThrow('Invalid signature');
    });

    it('should throw error if payment not found', async () => {
      const callbackData = {
        orderId: 'order-123',
        signature: 'valid-signature',
      };

      mockMoMoProvider.verifySignature.mockReturnValue(true);
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(service.handleMoMoCallback(callbackData)).rejects.toThrow('Payment not found');
    });
  });

  describe('getPaymentByOrderId', () => {
    it('should return payment by order ID', async () => {
      const orderId = 'order-123';
      const mockPayment = {
        id: 'payment-123',
        orderId,
        amount: '100000',
        status: PaymentStatus.SUCCESS,
      };

      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.getPaymentByOrderId(orderId);

      expect(result).toEqual(mockPayment);
      expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
        where: { orderId },
      });
    });

    it('should return null if payment not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      const result = await service.getPaymentByOrderId('non-existent');

      expect(result).toBeNull();
    });
  });
});
