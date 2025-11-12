import { AuditLog } from '../models/types';
import { Request } from 'express';
export declare class AuditLogService {
    private auditRepo;
    constructor();
    logAction(action: string, entity: string, data: {
        userId?: string;
        userEmail?: string;
        entityId?: string;
        changes?: any;
        status?: 'success' | 'failure';
        errorMessage?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AuditLog>;
    logActionFromRequest(req: Request, action: string, entity: string, data: {
        entityId?: string;
        changes?: any;
        status?: 'success' | 'failure';
        errorMessage?: string;
    }): Promise<AuditLog>;
    getUserLogs(userId: string, limit?: number): Promise<AuditLog[]>;
    getEntityLogs(entity: string, entityId: string): Promise<AuditLog[]>;
    getLogsByAction(action: string, limit?: number): Promise<AuditLog[]>;
    getLogsByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]>;
    getFailures(limit?: number): Promise<AuditLog[]>;
    getStatistics(period?: {
        start: Date;
        end: Date;
    }): Promise<{
        totalActions: number;
        successfulActions: number;
        failedActions: number;
        topActions: Array<{
            action: string;
            count: number;
        }>;
        topUsers: Array<{
            userId: string;
            userEmail: string;
            count: number;
        }>;
    }>;
}
export declare const AuditActions: {
    USER_LOGIN: string;
    USER_LOGOUT: string;
    USER_REGISTER: string;
    PASSWORD_RESET: string;
    PASSWORD_CHANGE: string;
    USER_CREATE: string;
    USER_UPDATE: string;
    USER_DELETE: string;
    USER_SUSPEND: string;
    USER_ACTIVATE: string;
    RIDE_START: string;
    RIDE_END: string;
    RIDE_CANCEL: string;
    WALLET_CHARGE: string;
    WALLET_DEDUCT: string;
    WALLET_REFUND: string;
    BIKE_CREATE: string;
    BIKE_UPDATE: string;
    BIKE_DELETE: string;
    BIKE_MAINTENANCE: string;
    SETTINGS_UPDATE: string;
    PROMO_CREATE: string;
    PROMO_UPDATE: string;
    PROMO_DELETE: string;
    REFUND_REQUEST: string;
    REFUND_APPROVE: string;
    REFUND_REJECT: string;
    TICKET_CREATE: string;
    TICKET_UPDATE: string;
    TICKET_RESOLVE: string;
    REVIEW_CREATE: string;
    REVIEW_APPROVE: string;
    REVIEW_REJECT: string;
};
//# sourceMappingURL=AuditLogService.d.ts.map