import { Injectable, Logger } from '@nestjs/common';
import { UserServiceClient } from './clients/user-service.client';
import { AddressServiceClient } from './clients/address-service.client';
import { MailService } from './mail.service';

export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  customerId: string;
  addressId: string;
  totalAmount: number;
  currency: string;
  status: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly addressServiceClient: AddressServiceClient,
    private readonly mailService: MailService,
  ) {}

  async sendOrderCreatedNotification(event: OrderCreatedEvent): Promise<void> {
    try {
      this.logger.log(`Processing order created notification for order ${event.orderNumber}`);

      const address = await this.addressServiceClient.getAddressById(event.addressId);

      if (!address) {
        this.logger.warn(`No address found for address ID ${event.addressId}`);
        return;
      }

      if (!address.email) {
        this.logger.warn(`No email found in address ${event.addressId}`);
        return;
      }

      await this.mailService.sendEmail({
        to: address.email,
        subject: `Order Confirmation - ${event.orderNumber}`,
        html: this.generateOrderConfirmationEmail(event, address),
      });

      if (address.phoneNumber) {
        await this.sendSMS({
          to: address.phoneNumber,
          message: `Order ${event.orderNumber} confirmed! Total: ${event.totalAmount} ${event.currency}. We'll notify you when it ships.`,
        });
      }

      this.logger.log(`Order confirmation sent to ${address.email} for order ${event.orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send order notification: ${error.message}`, error.stack);
    }
  }

  private async getCustomerEmail(customerId: string): Promise<string | null> {
    this.logger.log(`Fetching email for customer ${customerId} (mocked)`);
    return `customer-${customerId}@example.com`;
  }


  private async sendSMS(smsData: { to: string; message: string }): Promise<void> {
    this.logger.log(`Sending SMS to ${smsData.to}: ${smsData.message}`);

    this.logger.log('SMS sent successfully (mocked)');
  }

  private generateOrderConfirmationEmail(event: OrderCreatedEvent, address: any): string {
    const itemsHtml = event.items
      .map(
        item => `
        <tr>
          <td>${item.productName}</td>
          <td>${item.quantity}</td>
          <td>${item.unitPrice} ${event.currency}</td>
          <td>${item.totalAmount} ${event.currency}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #f8f9fa; padding: 20px; }
            .content { padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <p>Thank you for your order! Here are the details:</p>

            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${event.orderNumber}</p>
            <p><strong>Status:</strong> ${event.status}</p>
            <p><strong>Order Date:</strong> ${new Date(event.createdAt).toLocaleDateString()}</p>

            <h3>Items Ordered</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <p class="total">Total Amount: ${event.totalAmount} ${event.currency}</p>

            <h3>Shipping Address</h3>
            <p>
              ${address.fullName || 'N/A'}<br>
              ${address.addressLine1 || 'N/A'}<br>
              ${address.addressLine2 ? address.addressLine2 + '<br>' : ''}
              ${address.city || 'N/A'}, ${address.state || ''} ${address.postalCode || ''}<br>
              ${address.country || 'N/A'}
            </p>

            <p>We'll send you another notification when your order ships.</p>
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;
  }
}