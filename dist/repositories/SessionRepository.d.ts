import { BaseRepository } from './BaseRepository';
import { Session } from '../models/types';
export declare class SessionRepository extends BaseRepository<Session> {
    constructor();
    findByUserId(userId: string): Promise<Session[]>;
    findByToken(token: string): Promise<Session | null>;
    createSession(data: {
        userId: string;
        token: string;
        device?: string;
        location?: string;
        ipAddress?: string;
        userAgent?: string;
        expiresAt: Date;
    }): Promise<Session>;
    deactivateExistingSessions(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    deactivateSession(sessionId: string): Promise<void>;
    deactivateAllUserSessions(userId: string, excludeSessionId?: string): Promise<void>;
    deleteExpiredSessions(): Promise<void>;
    updateLastActivity(sessionId: string): Promise<void>;
    getUserSessionsWithDetails(userId: string): Promise<any[]>;
    private parseDeviceFromUserAgent;
    private formatLastActive;
}
//# sourceMappingURL=SessionRepository.d.ts.map