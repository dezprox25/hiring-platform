import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);

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

  /**
   * Send an invite email to a new candidate
   * @param to Candidate email
   * @param fullName Candidate full name
   * @param password Temporary password
   */
  async sendInvite(to: string, fullName: string, password: string): Promise<void> {
    if (!this.transporter) {
      console.warn(`Mail not configured — skipped invite email for ${to}`);
      return;
    }

    const appUrl = this.configService.get<string>('APP_URL');
    const from = this.configService.get<string>('SMTP_FROM') || 'noreply@dezprox.com';

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
    } catch (error) {
      console.error('Mail send failed:', error);
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordReset(to: string, token: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL') || this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${appUrl}/reset-password?token=${token}`;
    const from = this.configService.get<string>('SMTP_FROM') || 'noreply@dezprox.com';

    if (!this.transporter) {
      console.log(`[Dev Mail] Password Reset for ${to}: ${resetLink}`);
      return;
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a;">Password Reset Request</h2>
        <p style="color: #475569; line-height: 1.6;">
          We received a request to reset your Dezprox account password. Click the link below to set a new password:
        </p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Or copy this link into your browser: ${resetLink}</p>
        <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">
          If you didn't request a password reset, you can ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Reset your password — Dezprox',
        html,
      });
    } catch (error) {
      console.error('Password reset mail send failed:', error);
    }
  }
}

