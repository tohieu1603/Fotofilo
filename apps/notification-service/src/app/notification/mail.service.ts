import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter(): void {
    const host = this.configService.get<string>('MAILTRAP_HOST');
    const port = this.configService.get<number>('MAILTRAP_PORT');
    const username = this.configService.get<string>('MAILTRAP_USERNAME');
    const password = this.configService.get<string>('MAILTRAP_PASSWORD');

    if (!host || !port || !username || !password) {
      this.logger.error('Mailtrap configuration is incomplete. Please check your environment variables.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, 
      auth: {
        user: username,
        pass: password,
      },
    });

    this.logger.log('Mailtrap transporter created successfully');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.error('Mail transporter is not initialized');
        return false;
      }

      const fromName = this.configService.get<string>('MAIL_FROM_NAME', 'Fotofilo');
      const fromEmail = this.configService.get<string>('MAIL_FROM_EMAIL', 'noreply@fotofilo.com');

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      this.logger.log(`Sending email to ${options.to} with subject: ${options.subject}`);

      const result = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.error('Mail transporter is not initialized');
        return false;
      }

      await this.transporter.verify();
      this.logger.log('Mailtrap connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to verify Mailtrap connection: ${error.message}`, error.stack);
      return false;
    }
  }
}