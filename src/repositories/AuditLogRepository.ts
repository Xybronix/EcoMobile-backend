import { BaseRepository } from './BaseRepository';
import { AuditLog } from '../models/types';

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('audit_logs');
  }

  async findByUserId(userId: string, limit: number = 100): Promise<AuditLog[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('userId')} = ${this.getPlaceholder(1)}
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
      LIMIT ${this.getPlaceholder(2)}
    `;
    const results = await this.executeQuery(query, [userId, limit]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('entity')} = ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('entityId')} = ${this.getPlaceholder(2)}
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
    `;
    const results = await this.executeQuery(query, [entity, entityId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('action')} = ${this.getPlaceholder(1)}
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
      LIMIT ${this.getPlaceholder(2)}
    `;
    const results = await this.executeQuery(query, [action, limit]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('createdAt')} >= ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('createdAt')} <= ${this.getPlaceholder(2)}
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
    `;
    const results = await this.executeQuery(query, [startDate, endDate]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findFailures(limit: number = 50): Promise<AuditLog[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('status')} = 'failure'
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
      LIMIT ${this.getPlaceholder(1)}
    `;
    const results = await this.executeQuery(query, [limit]);
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
      whereClause = `WHERE ${this.quoteIdentifier('createdAt')} >= ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('createdAt')} <= ${this.getPlaceholder(2)}`;
      params.push(period.start, period.end);
    }

    const quotedTableName = this.quoteIdentifier(this.tableName);

    const countQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ${this.quoteIdentifier('status')} = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN ${this.quoteIdentifier('status')} = 'failure' THEN 1 ELSE 0 END) as failed
      FROM ${quotedTableName}
      ${whereClause}
    `;
    const countResults = await this.executeQuery(countQuery, params);

    const actionsQuery = `
      SELECT ${this.quoteIdentifier('action')}, COUNT(*) as count
      FROM ${quotedTableName}
      ${whereClause}
      GROUP BY ${this.quoteIdentifier('action')}
      ORDER BY count DESC
      LIMIT 10
    `;
    const actionsResults = await this.executeQuery(actionsQuery, params);

    const usersQuery = `
      SELECT ${this.quoteIdentifier('userId')}, ${this.quoteIdentifier('userEmail')}, COUNT(*) as count
      FROM ${quotedTableName}
      ${whereClause}
      GROUP BY ${this.quoteIdentifier('userId')}, ${this.quoteIdentifier('userEmail')}
      ORDER BY count DESC
      LIMIT 10
    `;
    const usersResults = await this.executeQuery(usersQuery, params);

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
