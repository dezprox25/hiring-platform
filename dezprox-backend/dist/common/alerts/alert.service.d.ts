import { ConfigService } from '@nestjs/config';
export declare class AlertService {
    private readonly configService;
    private readonly logger;
    private readonly webhookUrl;
    constructor(configService: ConfigService);
    sendAlert(message: string, context?: any): Promise<void>;
    sendCriticalError(error: Error, context?: any): Promise<void>;
}
