import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLog } from '../models/types';
import { randomUUID } from 'crypto';
import { Request } from 'express';

export class AuditLogService {
  private auditRepo: AuditLogRepository;

  constructor() {
    this.auditRepo = new AuditLogRepository();
  }

  async logAction(
    action: string,
    entity: string,
    data: {
      userId?: string;
      userEmail?: string;
      entityId?: string;
      changes?: any;
      status?: 'success' | 'failure';
      errorMessage?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AuditLog> {
    const log: AuditLog = {
      id: randomUUID(),
      action,
      entity,
      ...data,
      status: data.status || 'success',
      createdAt: new Date()
    };

    return await this.auditRepo.create(log);
  }

  async logActionFromRequest(
    req: Request,
    action: string,
    entity: string,
    data: {
      entityId?: string;
      changes?: any;
      status?: 'success' | 'failure';
      errorMessage?: string;
    }
  ): Promise<AuditLog> {
    const user = (req as any).user;

    return await this.logAction(action, entity, {
      ...data,
      userId: user?.id,
      userEmail: user?.email,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });
  }

  async getUserLogs(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return await this.auditRepo.findByUserId(userId, limit);
  }

  async getEntityLogs(entity: string, entityId: string): Promise<AuditLog[]> {
    return await this.auditRepo.findByEntity(entity, entityId);
  }

  async getLogsByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
    return await this.auditRepo.findByAction(action, limit);
  }

  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    return await this.auditRepo.findByDateRange(startDate, endDate);
  }

  async getFailures(limit: number = 50): Promise<AuditLog[]> {
    return await this.auditRepo.findFailures(limit);
  }

  async getStatistics(period?: { start: Date; end: Date }): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; userEmail: string; count: number }>;
  }> {
    return await this.auditRepo.getStatistics(period);
  }
}

// Predefined action types
export const AuditActions = {
  // Auth actions
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_REGISTER: 'user.register',
  PASSWORD_RESET: 'user.password_reset',
  PASSWORD_CHANGE: 'user.password_change',
  
  // User actions
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_SUSPEND: 'user.suspend',
  USER_ACTIVATE: 'user.activate',
  
  // Ride actions
  RIDE_START: 'ride.start',
  RIDE_END: 'ride.end',
  RIDE_CANCEL: 'ride.cancel',
  
  // Wallet actions
  WALLET_CHARGE: 'wallet.charge',
  WALLET_DEDUCT: 'wallet.deduct',
  WALLET_REFUND: 'wallet.refund',
  
  // Bike actions
  BIKE_CREATE: 'bike.create',
  BIKE_UPDATE: 'bike.update',
  BIKE_DELETE: 'bike.delete',
  BIKE_MAINTENANCE: 'bike.maintenance',
  
  // Admin actions
  SETTINGS_UPDATE: 'settings.update',
  PROMO_CREATE: 'promo.create',
  PROMO_UPDATE: 'promo.update',
  PROMO_DELETE: 'promo.delete',
  
  // Refund actions
  REFUND_REQUEST: 'refund.request',
  REFUND_APPROVE: 'refund.approve',
  REFUND_REJECT: 'refund.reject',
  
  // Ticket actions
  TICKET_CREATE: 'ticket.create',
  TICKET_UPDATE: 'ticket.update',
  TICKET_RESOLVE: 'ticket.resolve',
  
  // Review actions
  REVIEW_CREATE: 'review.create',
  REVIEW_APPROVE: 'review.approve',
  REVIEW_REJECT: 'review.reject'
};
