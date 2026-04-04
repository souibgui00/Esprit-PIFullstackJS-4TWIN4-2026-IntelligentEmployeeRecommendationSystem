import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');
    const emailSmtpHost = this.configService.get<string>('EMAIL_SMTP_HOST');
    const emailSmtpPort = this.configService.get<number>('EMAIL_SMTP_PORT');

    if (!emailUser || !emailPassword) {
      this.logger.warn('Email credentials not configured. Email service disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailSmtpHost || 'smtp.gmail.com',
      port: emailSmtpPort || 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  async sendNewUserCredentials(
    userEmail: string,
    userName: string,
    password: string,
    matricule: string,
  ): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('Email service not configured. Credentials not sent.');
        this.logger.log(`Generated Password for ${userName}: ${password}`);
        return false;
      }

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM') || this.configService.get<string>('EMAIL_USER'),
        to: userEmail,
        subject: '🎉 Welcome to Our HR Platform - Your Login Credentials',
        html: this.getNewUserEmailTemplate(userName, userEmail, password, matricule),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${userEmail}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${userEmail}: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw - email is non-critical
      return false;
    }
  }

  private getNewUserEmailTemplate(
    userName: string,
    email: string,
    password: string,
    matricule: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }
          .credentials-box {
            background-color: #f9f9f9;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .credential-item {
            margin: 12px 0;
            font-size: 14px;
          }
          .credential-label {
            font-weight: bold;
            color: #667eea;
            display: inline-block;
            width: 100px;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 6px 12px;
            border-radius: 4px;
            display: inline-block;
            border: 1px solid #ddd;
          }
          .cta-section {
            text-align: center;
            margin: 30px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .security-note {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #856404;
          }
          .footer {
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #eee;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🎉 Welcome Aboard!</h1>
            <p>Your account has been created</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <p>Hello <strong>${userName}</strong>,</p>
              <p>Your HR platform account has been successfully created. Use the credentials below to log in and get started.</p>
            </div>

            <div class="credentials-box">
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${password}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Matricule:</span>
                <span class="credential-value">${matricule}</span>
              </div>
            </div>

            <div class="cta-section">
              <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'}/login" class="cta-button">
                Log In Now
              </a>
            </div>

            <div class="security-note">
              <strong>🔒 Security Note:</strong> Please keep your password confidential. Never share it with anyone. You can change your password after logging in from your account settings.
            </div>

            <div style="color: #666; font-size: 14px; line-height: 1.6;">
              <p><strong>What's Next?</strong></p>
              <ul>
                <li>Log in with the credentials above</li>
                <li>Update your profile information</li>
                <li>Change your password (strongly recommended)</li>
                <li>Start exploring the platform</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p><strong>HR Management Platform</strong></p>
            <p>© 2026 All rights reserved.</p>
            <p>If you did not request this account, please contact your HR administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendResetPasswordEmail(
    userEmail: string,
    userName: string,
    resetLink: string,
  ): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('Email service not configured.');
        return false;
      }

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM') || this.configService.get<string>('EMAIL_USER'),
        to: userEmail,
        subject: 'Reset Your Password - HR Platform',
        html: `
          <h2>Hello ${userName},</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
