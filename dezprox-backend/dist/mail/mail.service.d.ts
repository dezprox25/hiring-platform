import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    sendInvite(to: string, fullName: string, password: string): Promise<void>;
}
