import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly webhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('ALERT_WEBHOOK_URL');
  }

  async sendAlert(message: string, context?: any) {
    if (!this.webhookUrl) {
      this.logger.warn('Alert Webhook URL not configured. Logging instead.');
      this.logger.error(`ALERT: ${message}`, context);
      return;
    }

    try {
      await axios.post(this.webhookUrl, {
        content: `🚨 **Production Alert: Dezprox**\n\n**Message:** ${message}\n**Environment:** ${process.env.NODE_ENV || 'development'}\n**Timestamp:** ${new Date().toISOString()}\n\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``,
      });
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to send alert to webhook: ${errMsg}`);
    }
  }

  async sendCriticalError(error: Error, context?: any) {
    await this.sendAlert(`CRITICAL ERROR: ${error.message}`, {
      stack: error.stack,
      ...context,
    });
  }
}
