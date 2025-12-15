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

import { 
  UserRepository, 
  BikeRepository, 
  WalletRepository, 
  TransactionRepository,
  IncidentRepository,
  ChatMessageRepository,
  ConversationRepository,
  NotificationRepository
} from '../repositories';
import { AppError } from '../middleware/errorHandler';
import { t } from '../locales';
import { User, Bike, Incident } from '../models/types';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(page: number = 1, limit: number = 10, role?: string) {
    const where = role ? { role } : undefined;
    return this.userRepository.findAll({ page, limit, where });
  }

  async getUserById(userId: string, language: 'fr' | 'en' = 'fr') {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(t('user.not_found', language), 404);
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(userId: string, data: Partial<User>, language: 'fr' | 'en' = 'fr') {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(t('user.not_found', language), 404);
    }
    return this.userRepository.update(userId, data);
  }

  async deleteUser(userId: string, language: 'fr' | 'en' = 'fr') {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(t('user.not_found', language), 404);
    }
    return this.userRepository.delete(userId);
  }
}

export class BikeService {
  private bikeRepository: BikeRepository;

  constructor() {
    this.bikeRepository = new BikeRepository();
  }

  async getAllBikes(page: number = 1, limit: number = 10, status?: string) {
    const where = status ? { status } : undefined;
    return this.bikeRepository.findAll({ page, limit, where });
  }

  async getBikeById(bikeId: string, language: 'fr' | 'en' = 'fr') {
    const bike = await this.bikeRepository.findById(bikeId);
    if (!bike) {
      throw new AppError(t('bike.not_found', language), 404);
    }
    return bike;
  }

  async getAvailableBikes() {
    return this.bikeRepository.findAvailableBikes();
  }

  async getNearbyBikes(latitude: number, longitude: number, radius: number = 5) {
    return this.bikeRepository.findNearby(latitude, longitude, radius);
  }

  async createBike(data: Partial<Bike>) {
    return this.bikeRepository.create(data);
  }

  async updateBike(bikeId: string, data: Partial<Bike>, language: 'fr' | 'en' = 'fr') {
    const bike = await this.bikeRepository.findById(bikeId);
    if (!bike) {
      throw new AppError(t('bike.not_found', language), 404);
    }
    return this.bikeRepository.update(bikeId, data);
  }

  async deleteBike(bikeId: string, language: 'fr' | 'en' = 'fr') {
    const bike = await this.bikeRepository.findById(bikeId);
    if (!bike) {
      throw new AppError(t('bike.not_found', language), 404);
    }
    return this.bikeRepository.delete(bikeId);
  }
}

export class WalletService {
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
  }

  async getUserWallet(userId: string, language: 'fr' | 'en' = 'fr') {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new AppError(t('wallet.not_found', language), 404);
    }
    return wallet;
  }

  async chargeWallet(userId: string, amount: number, language: 'fr' | 'en' = 'fr') {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new AppError(t('wallet.not_found', language), 404);
    }

    await this.walletRepository.updateBalance(wallet.id, amount);

    await this.transactionRepository.create({
      userId,
      type: 'charge',
      amount,
      currency: 'EUR',
      status: 'completed',
      description: language === 'fr' ? 'Rechargement du portefeuille' : 'Wallet charge'
    });

    return this.walletRepository.findById(wallet.id);
  }

  async getTransactions(userId: string) {
    return this.transactionRepository.findByUserId(userId);
  }
}

export class IncidentService {
  private incidentRepository: IncidentRepository;

  constructor() {
    this.incidentRepository = new IncidentRepository();
  }

  async createIncident(data: Partial<Incident>) {
    return this.incidentRepository.create(data);
  }

  async getIncident(incidentId: string, language: 'fr' | 'en' = 'fr') {
    const incident = await this.incidentRepository.findById(incidentId);
    if (!incident) {
      throw new AppError(t('incident.not_found', language), 404);
    }
    return incident;
  }

  async getUserIncidents(userId: string) {
    return this.incidentRepository.findByUserId(userId);
  }

  async getAllIncidents(page: number = 1, limit: number = 10) {
    return this.incidentRepository.findAll({ page, limit });
  }

  async updateIncident(incidentId: string, data: Partial<Incident>, language: 'fr' | 'en' = 'fr') {
    const incident = await this.incidentRepository.findById(incidentId);
    if (!incident) {
      throw new AppError(t('incident.not_found', language), 404);
    }
    return this.incidentRepository.update(incidentId, data);
  }
}

export class ChatService {
  private conversationRepository: ConversationRepository;
  private messageRepository: ChatMessageRepository;

  constructor() {
    this.conversationRepository = new ConversationRepository();
    this.messageRepository = new ChatMessageRepository();
  }

  async createConversation(userId: string, subject: string) {
    return this.conversationRepository.create({
      userId,
      subject,
      status: 'open',
      priority: 'medium',
      lastMessageAt: new Date()
    });
  }

  async getUserConversations(userId: string) {
    return this.conversationRepository.findByUserId(userId);
  }

  async sendMessage(conversationId: string, senderId: string, senderType: 'user' | 'admin', message: string) {
    const newMessage = await this.messageRepository.create({
      conversationId,
      senderId,
      senderType,
      message,
      read: false
    });

    await this.conversationRepository.updateLastMessage(conversationId);

    return newMessage;
  }

  async getConversationMessages(conversationId: string) {
    return this.messageRepository.findByConversationId(conversationId);
  }

  async markMessageAsRead(messageId: string) {
    return this.messageRepository.markAsRead(messageId);
  }
}

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    return this.notificationRepository.findByUserId(userId, unreadOnly);
  }

  async markAsRead(notificationId: string) {
    return this.notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepository.markAllAsRead(userId);
  }

  async createNotification(data: Partial<any>) {
    return this.notificationRepository.create(data);
  }
}
