import { BaseRepository } from './BaseRepository';
import { AuditLog } from '../models/types';
export declare class AuditLogRepository extends BaseRepository<AuditLog> {
    constructor();
    findByUserId(userId: string, limit?: number): Promise<AuditLog[]>;
    findByEntity(entity: string, entityId: string): Promise<AuditLog[]>;
    findByAction(action: string, limit?: number): Promise<AuditLog[]>;
    findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]>;
    findFailures(limit?: number): Promise<AuditLog[]>;
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
    protected mapToModel(row: any): AuditLog;
}
//# sourceMappingURL=AuditLogRepository.d.ts.map