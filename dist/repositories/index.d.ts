export { BaseRepository } from './BaseRepository';
export { UserRepository } from './UserRepository';
export { BikeRepository } from './BikeRepository';
export { RideRepository } from './RideRepository';
export { PromoCodeRepository, PromoCodeUsageRepository } from './PromoCodeRepository';
export { ReviewRepository } from './ReviewRepository';
export { RefundRepository } from './RefundRepository';
export { SupportTicketRepository, TicketMessageRepository } from './SupportTicketRepository';
export { AuditLogRepository } from './AuditLogRepository';
export { MaintenanceAlertRepository } from './MaintenanceAlertRepository';
export { GeofenceRepository } from './GeofenceRepository';
export { SessionRepository } from './SessionRepository';
import { BaseRepository } from './BaseRepository';
import { Wallet, Transaction, Incident, Maintenance, ChatMessage, Conversation, Notification, PricingConfig, ActivityLog } from '../models/types';
export declare class WalletRepository extends BaseRepository<Wallet> {
    constructor();
    findByUserId(userId: string): Promise<Wallet | null>;
    updateBalance(walletId: string, amount: number): Promise<void>;
}
export declare class TransactionRepository extends BaseRepository<Transaction> {
    constructor();
    findByUserId(userId: string): Promise<Transaction[]>;
    findByRideId(rideId: string): Promise<Transaction | null>;
}
export declare class IncidentRepository extends BaseRepository<Incident> {
    constructor();
    findByUserId(userId: string): Promise<Incident[]>;
    findByBikeId(bikeId: string): Promise<Incident[]>;
    findByStatus(status: Incident['status']): Promise<Incident[]>;
}
export declare class MaintenanceRepository extends BaseRepository<Maintenance> {
    constructor();
    findByBikeId(bikeId: string): Promise<Maintenance[]>;
    findByStatus(status: Maintenance['status']): Promise<Maintenance[]>;
}
export declare class ChatMessageRepository extends BaseRepository<ChatMessage> {
    constructor();
    findByConversationId(conversationId: string): Promise<ChatMessage[]>;
    markAsRead(messageId: string): Promise<void>;
}
export declare class ConversationRepository extends BaseRepository<Conversation> {
    constructor();
    findByUserId(userId: string): Promise<Conversation[]>;
    updateLastMessage(conversationId: string): Promise<void>;
}
export declare class NotificationRepository extends BaseRepository<Notification> {
    constructor();
    findByUserId(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
    markAsRead(notificationId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
}
export declare class PricingConfigRepository extends BaseRepository<PricingConfig> {
    constructor();
    findActive(): Promise<PricingConfig[]>;
}
export declare class ActivityLogRepository extends BaseRepository<ActivityLog> {
    constructor();
    findByUserId(userId: string): Promise<ActivityLog[]>;
    findByEntity(entity: string, entityId: string): Promise<ActivityLog[]>;
}
//# sourceMappingURL=index.d.ts.map