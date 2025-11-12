"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const repositories_1 = require("../repositories");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const locales_1 = require("../locales");
const NotificationService_1 = __importDefault(require("./NotificationService"));
class AuthService {
    constructor() {
        this.userRepository = new repositories_1.UserRepository();
        this.sessionRepository = new repositories_1.SessionRepository();
        this.notificationService = new NotificationService_1.default();
    }
    async register(data, language = 'fr') {
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new errorHandler_1.AppError((0, locales_1.t)('auth.register.email_exists', language), 400);
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
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
        const token = (0, auth_1.generateToken)({ id: user.id, email: user.email, role: user.role, roleId: user.roleId || '' });
        const refreshToken = (0, auth_1.generateRefreshToken)({ id: user.id, email: user.email, role: user.role, roleId: user.roleId || '' });
        // Send welcome notification and email
        try {
            await this.notificationService.sendWelcomeNotification(user.id, user.email, user.firstName, language);
        }
        catch (error) {
            console.error('Failed to send welcome notification:', error);
            // Don't throw - registration was successful
        }
        return {
            user: userWithoutPassword,
            token,
            refreshToken
        };
    }
    async login(credentials, language = 'fr', req) {
        // Find user
        const user = await this.userRepository.findByEmail(credentials.email);
        if (!user) {
            throw new errorHandler_1.AppError((0, locales_1.t)('auth.login.failed', language), 401);
        }
        // Check password
        const isValidPassword = await bcryptjs_1.default.compare(credentials.password, user.password);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError((0, locales_1.t)('auth.login.failed', language), 401);
        }
        // Check if user is active
        if (user.status !== 'active') {
            throw new errorHandler_1.AppError((0, locales_1.t)('auth.unauthorized', language), 403);
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        // Generate tokens
        const token = (0, auth_1.generateToken)({ id: user.id, email: user.email, role: user.role, roleId: user.roleId || '' });
        const refreshToken = (0, auth_1.generateRefreshToken)({ id: user.id, email: user.email, role: user.role, roleId: user.roleId || '' });
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
            }
            catch (sessionError) {
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
    async getUserById(userId, language = 'fr') {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError((0, locales_1.t)('user.not_found', language), 404);
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updateProfile(userId, data, language = 'fr') {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError((0, locales_1.t)('user.not_found', language), 404);
        }
        // Check if email is being changed and already exists
        if (data.email !== user.email) {
            const existingUser = await this.userRepository.findByEmail(data.email);
            if (existingUser && existingUser.id !== userId) {
                throw new errorHandler_1.AppError((0, locales_1.t)('auth.register.email_exists', language), 400);
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
    async getSessions(userId, language = 'fr') {
        try {
            // Clean up expired sessions first
            await this.sessionRepository.deleteExpiredSessions();
            // Get active sessions for the user
            const sessions = await this.sessionRepository.getUserSessionsWithDetails(userId);
            return sessions;
        }
        catch (error) {
            console.error('Error fetching sessions:', error);
            throw new errorHandler_1.AppError((0, locales_1.t)('session.fetch.error', language), 500);
        }
    }
    async disconnectSession(userId, sessionId, language = 'fr') {
        try {
            // Verify the session belongs to the user
            const sessions = await this.sessionRepository.findByUserId(userId);
            const session = sessions.find((s) => s.id === sessionId);
            if (!session) {
                throw new errorHandler_1.AppError((0, locales_1.t)('session.not_found', language), 404);
            }
            await this.sessionRepository.deactivateSession(sessionId);
        }
        catch (error) {
            console.error('Error disconnecting session:', error);
            throw new errorHandler_1.AppError((0, locales_1.t)('session.disconnect.error', language), 500);
        }
    }
    async disconnectAllSessions(userId, language = 'fr') {
        try {
            await this.sessionRepository.deactivateAllUserSessions(userId);
        }
        catch (error) {
            console.error('Error disconnecting all sessions:', error);
            throw new errorHandler_1.AppError((0, locales_1.t)('session.disconnect_all.error', language), 500);
        }
    }
    async forgotPassword(email, language = 'fr') {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Don't reveal if user exists or not for security
            return 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.';
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        // Send password reset notification and email
        try {
            await this.notificationService.sendPasswordResetNotification(user.id, user.email, user.firstName, resetToken, language);
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
            throw new errorHandler_1.AppError('Failed to send password reset email', 500);
        }
        return 'Email de réinitialisation envoyé avec succès';
    }
    async resetPassword(email, newPassword, language = 'fr') {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new errorHandler_1.AppError((0, locales_1.t)('user.not_found', language), 404);
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await this.userRepository.updatePassword(user.id, hashedPassword);
        // Deactivate all sessions for security
        await this.sessionRepository.deactivateAllUserSessions(user.id);
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async changePassword(userId, currentPassword, newPassword, language = 'fr') {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError((0, locales_1.t)('user.not_found', language), 404);
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError((0, locales_1.t)('auth.password.current.invalid', language), 401);
        }
        // Validate new password strength
        if (newPassword.length < 8) {
            throw new errorHandler_1.AppError('Le mot de passe doit contenir au moins 8 caractères', 400);
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            throw new errorHandler_1.AppError('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre', 400);
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await this.userRepository.updatePassword(userId, hashedPassword);
    }
    async logout(userId, _language = 'fr') {
        try {
            await this.sessionRepository.deactivateAllUserSessions(userId);
        }
        catch (error) {
            console.error('Error during logout:', error);
        }
    }
    parseDeviceFromUserAgent(userAgent) {
        if (!userAgent)
            return 'Appareil inconnu';
        if (userAgent.includes('Chrome')) {
            if (userAgent.includes('Windows'))
                return 'Chrome sur Windows';
            if (userAgent.includes('Mac'))
                return 'Chrome sur Mac';
            if (userAgent.includes('Android'))
                return 'Chrome sur Android';
            return 'Chrome';
        }
        if (userAgent.includes('Safari')) {
            if (userAgent.includes('iPhone'))
                return 'Safari sur iPhone';
            if (userAgent.includes('iPad'))
                return 'Safari sur iPad';
            if (userAgent.includes('Mac'))
                return 'Safari sur Mac';
            return 'Safari';
        }
        if (userAgent.includes('Firefox')) {
            if (userAgent.includes('Windows'))
                return 'Firefox sur Windows';
            if (userAgent.includes('Mac'))
                return 'Firefox sur Mac';
            return 'Firefox';
        }
        return 'Navigateur inconnu';
    }
    async getLocationFromIP(ip) {
        if (!ip || ip === '127.0.0.1' || ip === '::1') {
            return 'Localisation locale';
        }
        return 'Cameroun'; // Default for your app context
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map