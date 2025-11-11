import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRepository, SessionRepository } from '../repositories';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/types';
import { generateToken, generateRefreshToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { t } from '../locales';
import NotificationService from './NotificationService';

export class AuthService {
  private userRepository: UserRepository;
  private sessionRepository: SessionRepository;
  private notificationService: NotificationService;

  constructor() {
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
    this.notificationService = new NotificationService();
  }

  async register(data: RegisterRequest, language: 'fr' | 'en' = 'fr'): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(t('auth.register.email_exists', language), 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: 'user',
      status: 'active',
      emailVerified: false,
      language: data.language || language
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // Generate tokens
    const token = generateToken({ id: user.id, email: user.email, role: user.role, roleId: user.roleId || '' });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, roleId: user.roleId || '' });

    // Send welcome notification and email
    try {
      await this.notificationService.sendWelcomeNotification(
        user.id,
        user.email,
        user.firstName,
        language
      );
    } catch (error) {
      console.error('Failed to send welcome notification:', error);
      // Don't throw - registration was successful
    }

    return {
      user: userWithoutPassword,
      token,
      refreshToken
    };
  }

  async login(credentials: LoginRequest, language: 'fr' | 'en' = 'fr', req?: any): Promise<AuthResponse> {
    // Find user
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new AppError(t('auth.login.failed', language), 401);
    }

    // Check password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password!);
    if (!isValidPassword) {
      throw new AppError(t('auth.login.failed', language), 401);
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AppError(t('auth.unauthorized', language), 403);
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // Generate tokens
    const token = generateToken({ id: user.id, email: user.email, role: user.role, roleId: user.roleId || '' });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, roleId: user.roleId || '' });

    if (req) {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await this.sessionRepository.createSession({
          userId: user.id,
          token: token,
          device: this.parseDeviceFromUserAgent(req.get('User-Agent')),
          location: await this.getLocationFromIP(req.ip),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          expiresAt
        });
      } catch (sessionError) {
        console.error('Failed to create session:', sessionError);
        // Continue login even if session creation fails
      }
    }

    return {
      user: userWithoutPassword,
      token,
      refreshToken
    };
  }

  async getUserById(userId: string, language: 'fr' | 'en' = 'fr'): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(t('user.not_found', language), 404);
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
  }, language: 'fr' | 'en' = 'fr'): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(t('user.not_found', language), 404);
    }

    // Check if email is being changed and already exists
    if (data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw new AppError(t('auth.register.email_exists', language), 400);
      }
    }

    const updatedUser = await this.userRepository.update(userId, {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async getSessions(userId: string, language: 'fr' | 'en' = 'fr'): Promise<any[]> {
    try {
      // Clean up expired sessions first
      await this.sessionRepository.deleteExpiredSessions();
      
      // Get active sessions for the user
      const sessions = await this.sessionRepository.getUserSessionsWithDetails(userId);
      return sessions;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw new AppError(t('session.fetch.error', language), 500);
    }
  }

  async disconnectSession(userId: string, sessionId: string, language: 'fr' | 'en' = 'fr'): Promise<void> {
    try {
      // Verify the session belongs to the user
      const sessions = await this.sessionRepository.findByUserId(userId);
      const session = sessions.find((s: { id: string; }) => s.id === sessionId);
      
      if (!session) {
        throw new AppError(t('session.not_found', language), 404);
      }

      await this.sessionRepository.deactivateSession(sessionId);
    } catch (error) {
      console.error('Error disconnecting session:', error);
      throw new AppError(t('session.disconnect.error', language), 500);
    }
  }

  async disconnectAllSessions(userId: string, language: 'fr' | 'en' = 'fr'): Promise<void> {
    try {
      await this.sessionRepository.deactivateAllUserSessions(userId);
    } catch (error) {
      console.error('Error disconnecting all sessions:', error);
      throw new AppError(t('session.disconnect_all.error', language), 500);
    }
  }

  async forgotPassword(email: string, language: 'fr' | 'en' = 'fr'): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.';
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Send password reset notification and email
    try {
      await this.notificationService.sendPasswordResetNotification(
        user.id,
        user.email,
        user.firstName,
        resetToken,
        language
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new AppError('Failed to send password reset email', 500);
    }

    return 'Email de réinitialisation envoyé avec succès';
  }

  async resetPassword(email: string, newPassword: string, language: 'fr' | 'en' = 'fr'): Promise<any> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError(t('user.not_found', language), 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.updatePassword(user.id, hashedPassword);

    // Deactivate all sessions for security
    await this.sessionRepository.deactivateAllUserSessions(user.id);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, language: 'fr' | 'en' = 'fr'): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(t('user.not_found', language), 404);
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password!);
    if (!isValidPassword) {
      throw new AppError(t('auth.password.current.invalid', language), 401);
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new AppError('Le mot de passe doit contenir au moins 8 caractères', 400);
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new AppError('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.updatePassword(userId, hashedPassword);
  }

  async logout(userId: string, _language: 'fr' | 'en' = 'fr'): Promise<void> {
    try {
      await this.sessionRepository.deactivateAllUserSessions(userId);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  private parseDeviceFromUserAgent(userAgent?: string): string {
    if (!userAgent) return 'Appareil inconnu';
    
    if (userAgent.includes('Chrome')) {
      if (userAgent.includes('Windows')) return 'Chrome sur Windows';
      if (userAgent.includes('Mac')) return 'Chrome sur Mac';
      if (userAgent.includes('Android')) return 'Chrome sur Android';
      return 'Chrome';
    }
    
    if (userAgent.includes('Safari')) {
      if (userAgent.includes('iPhone')) return 'Safari sur iPhone';
      if (userAgent.includes('iPad')) return 'Safari sur iPad';
      if (userAgent.includes('Mac')) return 'Safari sur Mac';
      return 'Safari';
    }
    
    if (userAgent.includes('Firefox')) {
      if (userAgent.includes('Windows')) return 'Firefox sur Windows';
      if (userAgent.includes('Mac')) return 'Firefox sur Mac';
      return 'Firefox';
    }
    
    return 'Navigateur inconnu';
  }

  private async getLocationFromIP(ip?: string): Promise<string> {
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      return 'Localisation locale';
    }
    return 'Cameroun'; // Default for your app context
  }
}