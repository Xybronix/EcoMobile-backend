import crypto from 'crypto';
import { config } from '../config/config';
import EmailService from './EmailService';

export class EmailVerificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Générer un token de vérification d'email
   */
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculer la date d'expiration du token (24 heures)
   */
  getTokenExpiration(): Date {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 24);
    return expiration;
  }

  /**
   * Envoyer l'email de vérification
   */
  async sendVerificationEmail(
    userId: string,
    email: string,
    firstName: string,
    token: string,
    language: 'fr' | 'en' = 'fr'
  ): Promise<boolean> {
    try {
      const translations = {
        fr: {
          email: {
            verification_subject: 'Vérifiez votre email - FreeBike',
            verification_title: 'Vérification de votre compte',
            verification_message: `Bonjour {{firstName}},<br><br>Merci de vous être inscrit sur FreeBike ! Veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :<br><br>Ce lien expirera dans 24 heures.`,
            verification_cta: 'Vérifier mon email',
            verification_ignore: 'Si vous n\'avez pas créé de compte, vous pouvez ignorer cet email.',
            footer_text: '© 2024 FreeBike. Tous droits réservés.'
          }
        },
        en: {
          email: {
            verification_subject: 'Verify your email - FreeBike',
            verification_title: 'Account Verification',
            verification_message: `Hello {{firstName}},<br><br>Thank you for registering on FreeBike! Please verify your email address by clicking the button below:<br><br>This link will expire in 24 hours.`,
            verification_cta: 'Verify my email',
            verification_ignore: 'If you did not create an account, you can ignore this email.',
            footer_text: '© 2024 FreeBike. All rights reserved.'
          }
        }
      };

      const subject = translations[language].email.verification_subject;
      const title = translations[language].email.verification_title;
      const message = translations[language].email.verification_message.replace('{{firstName}}', firstName);
      const ctaText = translations[language].email.verification_cta;
      const ignoreText = translations[language].email.verification_ignore;
      const footerText = translations[language].email.footer_text;

      // URL de vérification (page web)
      const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}&userId=${userId}`;

      const html = `
        <!DOCTYPE html>
        <html lang="${language}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 0;
            }
            .header {
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #333333;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .content p {
              color: #666666;
              font-size: 16px;
              line-height: 1.8;
              margin-bottom: 20px;
              white-space: pre-line;
            }
            .cta-button {
              display: inline-block;
              padding: 14px 30px;
              background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
              font-size: 16px;
            }
            .verification-code {
              background-color: #f8f8f8;
              border: 1px solid #eeeeee;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
              font-family: monospace;
              font-size: 18px;
              color: #333333;
            }
            .additional-text {
              color: #999999;
              font-size: 14px;
              font-style: italic;
              margin-top: 20px;
            }
            .footer {
              background-color: #f8f8f8;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #eeeeee;
            }
            .footer p {
              color: #999999;
              font-size: 14px;
              margin: 5px 0;
            }
            .footer a {
              color: #16a34a;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚴 FreeBike</h1>
            </div>
            <div class="content">
              <h2>${title}</h2>
              <p>${message}</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="cta-button">${ctaText}</a>
              </div>
              <p class="additional-text">${ignoreText}</p>
            </div>
            <div class="footer">
              <p>${footerText}</p>
              <p>
                <a href="mailto:support@freebike.com">support@freebike.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.emailService.sendEmail({
        to: email,
        subject,
        html
      });

      console.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un token est valide
   */
  isTokenValid(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    return new Date() < expiresAt;
  }
}

export default EmailVerificationService;