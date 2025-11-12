import { LoginRequest, RegisterRequest, AuthResponse } from '../models/types';
export declare class AuthService {
    private userRepository;
    private sessionRepository;
    private notificationService;
    constructor();
    register(data: RegisterRequest, language?: 'fr' | 'en'): Promise<AuthResponse>;
    login(credentials: LoginRequest, language?: 'fr' | 'en', req?: any): Promise<AuthResponse>;
    getUserById(userId: string, language?: 'fr' | 'en'): Promise<any>;
    updateProfile(userId: string, data: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        address?: string;
    }, language?: 'fr' | 'en'): Promise<any>;
    getSessions(userId: string, language?: 'fr' | 'en'): Promise<any[]>;
    disconnectSession(userId: string, sessionId: string, language?: 'fr' | 'en'): Promise<void>;
    disconnectAllSessions(userId: string, language?: 'fr' | 'en'): Promise<void>;
    forgotPassword(email: string, language?: 'fr' | 'en'): Promise<string>;
    resetPassword(email: string, newPassword: string, language?: 'fr' | 'en'): Promise<any>;
    changePassword(userId: string, currentPassword: string, newPassword: string, language?: 'fr' | 'en'): Promise<void>;
    logout(userId: string, _language?: 'fr' | 'en'): Promise<void>;
    private parseDeviceFromUserAgent;
    private getLocationFromIP;
}
//# sourceMappingURL=AuthService.d.ts.map