import { BaseRepository } from './BaseRepository';
import { Session } from '../models/types';
import { randomUUID } from 'crypto';

export class SessionRepository extends BaseRepository<Session> {
  constructor() {
    super('sessions');
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE userId = ${this.getPlaceholder(1)} AND isActive = ${this.getPlaceholder(2)} ORDER BY updatedAt DESC`;
    return this.executeQuery(sql, [userId, true]);
  }

  async findByToken(token: string): Promise<Session | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE token = ${this.getPlaceholder(1)} AND isActive = ${this.getPlaceholder(2)}`;
    const result = await this.executeQuery(sql, [token, true]);
    return result[0] || null;
  }

  async createSession(data: {
    userId: string;
    token: string;
    device?: string;
    location?: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): Promise<Session> {
    const sessionToken = randomUUID();
    
    await this.deactivateExistingSessions(data.userId, data.ipAddress, data.userAgent);
    
    return this.create({
      ...data,
      token: sessionToken,
      isActive: true,
    });
  }

  async deactivateExistingSessions(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    if (ipAddress && userAgent) {
      const sql = `UPDATE ${this.tableName} SET isActive = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE userId = ${this.getPlaceholder(3)} AND ipAddress = ${this.getPlaceholder(4)} AND userAgent = ${this.getPlaceholder(5)} AND isActive = ${this.getPlaceholder(6)}`;
      await this.executeNonQuery(sql, [false, new Date(), userId, ipAddress, userAgent, true]);
    }
  }

  async deactivateSession(sessionId: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET isActive = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [false, new Date(), sessionId]);
  }

  async deactivateAllUserSessions(userId: string, excludeSessionId?: string): Promise<void> {
    let sql = `UPDATE ${this.tableName} SET isActive = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE userId = ${this.getPlaceholder(3)}`;
    const values = [false, new Date(), userId];

    if (excludeSessionId) {
      sql += ` AND id != ${this.getPlaceholder(4)}`;
      values.push(excludeSessionId);
    }

    await this.executeNonQuery(sql, values);
  }

  async deleteExpiredSessions(): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE expiresAt < ${this.getPlaceholder(1)}`;
    await this.executeNonQuery(sql, [new Date()]);
  }

  async updateLastActivity(sessionId: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET updatedAt = ${this.getPlaceholder(1)} WHERE id = ${this.getPlaceholder(2)}`;
    await this.executeNonQuery(sql, [new Date(), sessionId]);
  }

  async getUserSessionsWithDetails(userId: string): Promise<any[]> {
    const sql = `
      SELECT 
        id,
        device,
        location,
        ipAddress,
        userAgent,
        updatedAt,
        createdAt,
        CASE 
          WHEN updatedAt > ${this.getPlaceholder(2)} THEN true 
          ELSE false 
        END as current
      FROM ${this.tableName} 
      WHERE userId = ${this.getPlaceholder(1)} 
        AND isActive = true 
      ORDER BY updatedAt DESC
    `;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const sessions = await this.executeQuery(sql, [userId, fiveMinutesAgo]);
    
    return sessions.map((session: { id: any; userAgent: string | undefined; location: any; updatedAt: Date; current: any; ipAddress: any; }) => ({
      id: session.id,
      device: this.parseDeviceFromUserAgent(session.userAgent) || 'Appareil inconnu',
      location: session.location || 'Localisation inconnue',
      lastActive: this.formatLastActive(session.updatedAt),
      current: session.current || false,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    }));
  }

  private parseDeviceFromUserAgent(userAgent?: string): string {
    if (!userAgent) return 'Appareil inconnu';
    
    if (userAgent.includes('Chrome')) {
      if (userAgent.includes('Windows')) return 'Chrome sur Windows';
      if (userAgent.includes('Mac')) return 'Chrome sur Mac';
      if (userAgent.includes('Android')) return 'Chrome sur Android';
      return 'Chrome';
    }
    
    if (userAgent.includes('Safari')) {
      if (userAgent.includes('iPhone')) return 'Safari sur iPhone';
      if (userAgent.includes('iPad')) return 'Safari sur iPad';
      if (userAgent.includes('Mac')) return 'Safari sur Mac';
      return 'Safari';
    }
    
    if (userAgent.includes('Firefox')) {
      if (userAgent.includes('Windows')) return 'Firefox sur Windows';
      if (userAgent.includes('Mac')) return 'Firefox sur Mac';
      return 'Firefox';
    }
    
    return 'Navigateur inconnu';
  }

  private formatLastActive(updatedAt: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(updatedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
}