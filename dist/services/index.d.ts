export { AuthService } from './AuthService';
export { RideService } from './RideService';
export { PromoCodeService } from './PromoCodeService';
export { ReviewService } from './ReviewService';
export { RefundService } from './RefundService';
export { SupportTicketService } from './SupportTicketService';
export { AuditLogService, AuditActions } from './AuditLogService';
export { MaintenanceAlertService } from './MaintenanceAlertService';
export { GeofenceService } from './GeofenceService';
export { StatisticsService } from './StatisticsService';
export { HealthCheckService } from './HealthCheckService';
import { User, Bike, Incident } from '../models/types';
export declare class UserService {
    private userRepository;
    constructor();
    getAllUsers(page?: number, limit?: number, role?: string): Promise<User[]>;
    getUserById(userId: string, language?: 'fr' | 'en'): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
        avatar?: string;
        role: "user" | "employee" | "admin" | "super_admin";
        roleId?: string;
        status: "active" | "inactive" | "suspended";
        emailVerified: boolean;
        language: "fr" | "en";
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateUser(userId: string, data: Partial<User>, language?: 'fr' | 'en'): Promise<User>;
    deleteUser(userId: string, language?: 'fr' | 'en'): Promise<boolean>;
}
export declare class BikeService {
    private bikeRepository;
    constructor();
    getAllBikes(page?: number, limit?: number, status?: string): Promise<Bike[]>;
    getBikeById(bikeId: string, language?: 'fr' | 'en'): Promise<Bike>;
    getAvailableBikes(): Promise<Bike[]>;
    getNearbyBikes(latitude: number, longitude: number, radius?: number): Promise<Bike[]>;
    createBike(data: Partial<Bike>): Promise<Bike>;
    updateBike(bikeId: string, data: Partial<Bike>, language?: 'fr' | 'en'): Promise<Bike | null>;
    deleteBike(bikeId: string, language?: 'fr' | 'en'): Promise<boolean>;
}
export declare class WalletService {
    private walletRepository;
    private transactionRepository;
    constructor();
    getUserWallet(userId: string, language?: 'fr' | 'en'): Promise<import("../models/types").Wallet>;
    chargeWallet(userId: string, amount: number, language?: 'fr' | 'en'): Promise<import("../models/types").Wallet | null>;
    getTransactions(userId: string): Promise<import("../models/types").Transaction[]>;
}
export declare class IncidentService {
    private incidentRepository;
    constructor();
    createIncident(data: Partial<Incident>): Promise<Incident>;
    getIncident(incidentId: string, language?: 'fr' | 'en'): Promise<Incident>;
    getUserIncidents(userId: string): Promise<Incident[]>;
    getAllIncidents(page?: number, limit?: number): Promise<Incident[]>;
    updateIncident(incidentId: string, data: Partial<Incident>, language?: 'fr' | 'en'): Promise<Incident | null>;
}
export declare class ChatService {
    private conversationRepository;
    private messageRepository;
    constructor();
    createConversation(userId: string, subject: string): Promise<import("../models/types").Conversation>;
    getUserConversations(userId: string): Promise<import("../models/types").Conversation[]>;
    sendMessage(conversationId: string, senderId: string, senderType: 'user' | 'admin', message: string): Promise<import("../models/types").ChatMessage>;
    getConversationMessages(conversationId: string): Promise<import("../models/types").ChatMessage[]>;
    markMessageAsRead(messageId: string): Promise<void>;
}
export declare class NotificationService {
    private notificationRepository;
    constructor();
    getUserNotifications(userId: string, unreadOnly?: boolean): Promise<import("../models/types").Notification[]>;
    markAsRead(notificationId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    createNotification(data: Partial<any>): Promise<import("../models/types").Notification>;
}
//# sourceMappingURL=index.d.ts.map