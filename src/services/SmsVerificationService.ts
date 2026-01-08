import { prisma } from '../config/prisma';
import { t } from '../locales';

export class SmsVerificationService {
  /**
   * Generate a random verification code (4-6 digits)
   */
  generateVerificationCode(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Get expiration time for verification code (10 minutes)
   */
  getCodeExpiration(): Date {
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    return expires;
  }

  /**
   * Send SMS verification code
   * Supports multiple providers (Twilio, MessageBird, etc.)
   */
  async sendVerificationCode(phoneNumber: string, code: string, language: 'fr' | 'en' = 'fr'): Promise<void> {
    const smsProvider = process.env.SMS_PROVIDER || 'twilio';
    
    try {
      switch (smsProvider.toLowerCase()) {
        case 'twilio':
          await this.sendViaTwilio(phoneNumber, code, language);
          break;
        case 'messagebird':
          await this.sendViaMessageBird(phoneNumber, code, language);
          break;
        case 'mock':
          // For development/testing - just log the code
          console.log(`[MOCK SMS] Verification code for ${phoneNumber}: ${code}`);
          break;
        default:
          // Fallback to mock in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV SMS] Verification code for ${phoneNumber}: ${code}`);
          } else {
            throw new Error(`Unsupported SMS provider: ${smsProvider}`);
          }
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      // In development, we allow the code to be logged even if SMS fails
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV SMS] Verification code for ${phoneNumber}: ${code}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(phoneNumber: string, code: string, language: 'fr' | 'en'): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      // In development, just log
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TWILIO DEV] Would send code ${code} to ${phoneNumber}`);
        return;
      }
      throw new Error('Twilio credentials not configured');
    }

    try {
      // Dynamic import to avoid requiring twilio in production if not used
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);

      const message = language === 'fr' 
        ? `Votre code de vérification EcoMobile est: ${code}. Valide pendant 10 minutes.`
        : `Your EcoMobile verification code is: ${code}. Valid for 10 minutes.`;

      await client.messages.create({
        body: message,
        from: fromNumber,
        to: phoneNumber
      });
    } catch (error: any) {
      console.error('Twilio SMS error:', error);
      // In development, allow fallback
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TWILIO DEV] Code: ${code} for ${phoneNumber}`);
        return;
      }
      throw new Error(`Failed to send SMS via Twilio: ${error.message}`);
    }
  }

  /**
   * Send SMS via MessageBird
   */
  private async sendViaMessageBird(phoneNumber: string, code: string, language: 'fr' | 'en'): Promise<void> {
    const apiKey = process.env.MESSAGEBIRD_API_KEY;
    const originator = process.env.MESSAGEBIRD_ORIGINATOR || 'EcoMobile';

    if (!apiKey) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MESSAGEBIRD DEV] Would send code ${code} to ${phoneNumber}`);
        return;
      }
      throw new Error('MessageBird API key not configured');
    }

    try {
      const messagebird = require('messagebird')(apiKey);
      const message = language === 'fr' 
        ? `Votre code de vérification EcoMobile est: ${code}. Valide pendant 10 minutes.`
        : `Your EcoMobile verification code is: ${code}. Valid for 10 minutes.`;

      await new Promise((resolve, reject) => {
        messagebird.messages.create({
          originator: originator,
          recipients: [phoneNumber],
          body: message
        }, (err: any, response: any) => {
          if (err) reject(err);
          else resolve(response);
        });
      });
    } catch (error: any) {
      console.error('MessageBird SMS error:', error);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MESSAGEBIRD DEV] Code: ${code} for ${phoneNumber}`);
        return;
      }
      throw new Error(`Failed to send SMS via MessageBird: ${error.message}`);
    }
  }

  /**
   * Initiate phone verification
   */
  async initiatePhoneVerification(userId: string, phoneNumber: string, language: 'fr' | 'en' = 'fr'): Promise<string> {
    // Generate verification code
    const code = this.generateVerificationCode(6);
    const expiresAt = this.getCodeExpiration();

    // Update user with verification code
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phoneNumber,
        phoneVerificationCode: code,
        phoneVerificationExpires: expiresAt
      }
    });

    // Send SMS
    await this.sendVerificationCode(phoneNumber, code, language);

    return code; // Return code for development/testing
  }

  /**
   * Verify phone code
   */
  async verifyPhoneCode(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.phoneVerificationCode || !user.phoneVerificationExpires) {
      return false;
    }

    // Check if code is expired
    if (new Date() > user.phoneVerificationExpires) {
      return false;
    }

    // Check if code matches
    if (user.phoneVerificationCode !== code) {
      return false;
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationExpires: null
      }
    });

    return true;
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(userId: string, language: 'fr' | 'en' = 'fr'): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.phone) {
      throw new Error(t('error.phone_not_found', language));
    }

    await this.initiatePhoneVerification(userId, user.phone, language);
  }
}
