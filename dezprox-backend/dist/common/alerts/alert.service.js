"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AlertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let AlertService = AlertService_1 = class AlertService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AlertService_1.name);
        this.webhookUrl = this.configService.get('ALERT_WEBHOOK_URL');
    }
    async sendAlert(message, context) {
        if (!this.webhookUrl) {
            this.logger.warn('Alert Webhook URL not configured. Logging instead.');
            this.logger.error(`ALERT: ${message}`, context);
            return;
        }
        try {
            await axios_1.default.post(this.webhookUrl, {
                content: `🚨 **Production Alert: Dezprox**\n\n**Message:** ${message}\n**Environment:** ${process.env.NODE_ENV || 'development'}\n**Timestamp:** ${new Date().toISOString()}\n\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``,
            });
        }
        catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            this.logger.error(`Failed to send alert to webhook: ${errMsg}`);
        }
    }
    async sendCriticalError(error, context) {
        await this.sendAlert(`CRITICAL ERROR: ${error.message}`, {
            stack: error.stack,
            ...context,
        });
    }
};
exports.AlertService = AlertService;
exports.AlertService = AlertService = AlertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AlertService);
//# sourceMappingURL=alert.service.js.map