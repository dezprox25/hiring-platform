"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = class MailService {
    constructor(configService) {
        this.configService = configService;
        const host = this.configService.get('SMTP_HOST');
        const port = this.configService.get('SMTP_PORT');
        const user = this.configService.get('SMTP_USER');
        const pass = this.configService.get('SMTP_PASS');
        const secure = this.configService.get('SMTP_SECURE', false);
        if (!host || !user || !pass) {
            console.warn('Mail configuration is incomplete. Emails will not be sent.');
            return;
        }
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user,
                pass,
            },
        });
    }
    async sendInvite(to, fullName, password) {
        if (!this.transporter) {
            console.warn(`Mail not configured — skipped invite email for ${to}`);
            return;
        }
        const appUrl = this.configService.get('APP_URL');
        const from = this.configService.get('SMTP_FROM') || 'noreply@dezprox.com';
        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #0f172a;">Welcome to Dezprox, ${fullName}!</h2>
        <p style="color: #475569; line-height: 1.6;">
          Your assessment is waiting. Log in to your workspace to begin the hiring process.
        </p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Login Email:</p>
          <p style="margin: 4px 0 12px 0; font-weight: bold; color: #0f172a;">${to}</p>
          <p style="margin: 0; font-size: 14px; color: #64748b;">Temporary Password:</p>
          <p style="margin: 4px 0 0 0; font-weight: bold; color: #0f172a;">${password}</p>
        </div>
        <a href="${appUrl}/login" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Log In to Begin
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `;
        try {
            await this.transporter.sendMail({
                from,
                to,
                subject: 'Your Assessment Invite — Dezprox',
                html,
            });
        }
        catch (error) {
            console.error('Mail send failed:', error);
            throw new common_1.InternalServerErrorException('Failed to send invitation email');
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map