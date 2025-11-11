// Repository Exports
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

// Additional repositories can be imported here
import { BaseRepository } from './BaseRepository';
import { 
  Wallet, 
  Transaction, 
  Incident, 
  Maintenance, 
  ChatMessage, 
  Conversation, 
  Notification,
  PricingConfig,
  ActivityLog
} from '../models/types';

export class WalletRepository extends BaseRepository<Wallet> {
  constructor() {
    super('wallets');
  }

  async findByUserId(userId: string): Promise<Wallet | null> {
    return this.findOne({ userId });
  }

  async updateBalance(walletId: string, amount: number): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET balance = balance + ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [amount, new Date(), walletId]);
  }
}

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super('transactions');
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.findAll({ where: { userId }, sortBy: 'createdAt', sortOrder: 'DESC' });
  }

  async findByRideId(rideId: string): Promise<Transaction | null> {
    return this.findOne({ rideId });
  }
}

export class IncidentRepository extends BaseRepository<Incident> {
  constructor() {
    super('incidents');
  }

  async findByUserId(userId: string): Promise<Incident[]> {
    return this.findAll({ where: { userId }, sortBy: 'createdAt', sortOrder: 'DESC' });
  }

  async findByBikeId(bikeId: string): Promise<Incident[]> {
    return this.findAll({ where: { bikeId }, sortBy: 'createdAt', sortOrder: 'DESC' });
  }

  async findByStatus(status: Incident['status']): Promise<Incident[]> {
    return this.findAll({ where: { status } });
  }
}

export class MaintenanceRepository extends BaseRepository<Maintenance> {
  constructor() {
    super('maintenance');
  }

  async findByBikeId(bikeId: string): Promise<Maintenance[]> {
    return this.findAll({ where: { bikeId }, sortBy: 'scheduledDate', sortOrder: 'DESC' });
  }

  async findByStatus(status: Maintenance['status']): Promise<Maintenance[]> {
    return this.findAll({ where: { status } });
  }
}

export class ChatMessageRepository extends BaseRepository<ChatMessage> {
  constructor() {
    super('chat_messages');
  }

  async findByConversationId(conversationId: string): Promise<ChatMessage[]> {
    return this.findAll({ where: { conversationId }, sortBy: 'createdAt', sortOrder: 'ASC' });
  }

  async markAsRead(messageId: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET read = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [true, new Date(), messageId]);
  }
}

export class ConversationRepository extends BaseRepository<Conversation> {
  constructor() {
    super('conversations');
  }

  async findByUserId(userId: string): Promise<Conversation[]> {
    return this.findAll({ where: { userId }, sortBy: 'lastMessageAt', sortOrder: 'DESC' });
  }

  async updateLastMessage(conversationId: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET lastMessageAt = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [new Date(), new Date(), conversationId]);
  }
}

export class NotificationRepository extends BaseRepository<Notification> {
  constructor() {
    super('notifications');
  }

  async findByUserId(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }
    return this.findAll({ where, sortBy: 'createdAt', sortOrder: 'DESC' });
  }

  async markAsRead(notificationId: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET read = ${this.getPlaceholder(1)} WHERE id = ${this.getPlaceholder(2)}`;
    await this.executeNonQuery(sql, [true, notificationId]);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET read = ${this.getPlaceholder(1)} WHERE userId = ${this.getPlaceholder(2)}`;
    await this.executeNonQuery(sql, [true, userId]);
  }
}

export class PricingConfigRepository extends BaseRepository<PricingConfig> {
  constructor() {
    super('pricing_configs');
  }

  async findActive(): Promise<PricingConfig[]> {
    return this.findAll({ where: { active: true } });
  }
}

export class ActivityLogRepository extends BaseRepository<ActivityLog> {
  constructor() {
    super('activity_logs');
  }

  async findByUserId(userId: string): Promise<ActivityLog[]> {
    return this.findAll({ where: { userId }, sortBy: 'createdAt', sortOrder: 'DESC' });
  }

  async findByEntity(entity: string, entityId: string): Promise<ActivityLog[]> {
    return this.findAll({ where: { entity, entityId }, sortBy: 'createdAt', sortOrder: 'DESC' });
  }
}
