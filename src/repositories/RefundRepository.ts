import { BaseRepository } from './BaseRepository';
import { Refund } from '../models/types';

export class RefundRepository extends BaseRepository<Refund> {
  constructor() {
    super('refunds');
  }

  async findByUserId(userId: string): Promise<Refund[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('userId')} = ${this.getPlaceholder(1)}
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
    `;
    const results = await this.executeQuery(query, [userId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByRideId(rideId: string): Promise<Refund | null> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('rideId')} = ${this.getPlaceholder(1)}
      LIMIT 1
    `;
    const results = await this.executeQuery(query, [rideId]);
    return results.length > 0 ? this.mapToModel(results[0]) : null;
  }

  async findPending(): Promise<Refund[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('status')} = 'pending'
      ORDER BY ${this.quoteIdentifier('createdAt')} ASC
    `;
    const results = await this.executeQuery(query);
    return results.map((row: any) => this.mapToModel(row));
  }

  async getTotalRefundedAmount(period?: { start: Date; end: Date }): Promise<number> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    let query = `
      SELECT SUM(${this.quoteIdentifier('amount')}) as total FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('status')} = 'processed'
    `;
    const params: any[] = [];

    if (period) {
      query += ` AND ${this.quoteIdentifier('processedAt')} >= ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('processedAt')} <= ${this.getPlaceholder(2)}`;
      params.push(period.start, period.end);
    }

    const results = await this.executeQuery(query, params);
    return results[0]?.total || 0;
  }

  protected mapToModel(row: any): Refund {
    return {
      ...row,
      processedAt: row.processedAt ? new Date(row.processedAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}
