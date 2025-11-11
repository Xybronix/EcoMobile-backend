import { BaseRepository } from './BaseRepository';
import { AuditLog } from '../models/types';

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('audit_logs');
  }

  async findByUserId(userId: string, limit: number = 100): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `;
    const results = await this.db.query(query, [userId, limit]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE entity = ? AND entityId = ?
      ORDER BY createdAt DESC
    `;
    const results = await this.db.query(query, [entity, entityId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE action = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `;
    const results = await this.db.query(query, [action, limit]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE createdAt >= ? AND createdAt <= ?
      ORDER BY createdAt DESC
    `;
    const results = await this.db.query(query, [startDate, endDate]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findFailures(limit: number = 50): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'failure'
      ORDER BY createdAt DESC
      LIMIT ?
    `;
    const results = await this.db.query(query, [limit]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async getStatistics(period?: { start: Date; end: Date }): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; userEmail: string; count: number }>;
  }> {
    let whereClause = '';
    const params: any[] = [];

    if (period) {
      whereClause = 'WHERE createdAt >= ? AND createdAt <= ?';
      params.push(period.start, period.end);
    }

    const countQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failed
      FROM ${this.tableName}
      ${whereClause}
    `;
    const countResults = await this.db.query(countQuery, params);

    const actionsQuery = `
      SELECT action, COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;
    const actionsResults = await this.db.query(actionsQuery, params);

    const usersQuery = `
      SELECT userId, userEmail, COUNT(*) as count
      FROM ${this.tableName}
      ${whereClause}
      GROUP BY userId, userEmail
      ORDER BY count DESC
      LIMIT 10
    `;
    const usersResults = await this.db.query(usersQuery, params);

    return {
      totalActions: countResults[0]?.total || 0,
      successfulActions: countResults[0]?.successful || 0,
      failedActions: countResults[0]?.failed || 0,
      topActions: actionsResults,
      topUsers: usersResults
    };
  }

  protected mapToModel(row: any): AuditLog {
    return {
      ...row,
      changes: row.changes ? JSON.parse(row.changes) : undefined,
      createdAt: new Date(row.createdAt)
    };
  }
}
