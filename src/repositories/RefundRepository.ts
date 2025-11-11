import { BaseRepository } from './BaseRepository';
import { Refund } from '../models/types';

export class RefundRepository extends BaseRepository<Refund> {
  constructor() {
    super('refunds');
  }

  async findByUserId(userId: string): Promise<Refund[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE userId = ?
      ORDER BY createdAt DESC
    `;
    const results = await this.db.query(query, [userId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByRideId(rideId: string): Promise<Refund | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE rideId = ?
      LIMIT 1
    `;
    const results = await this.db.query(query, [rideId]);
    return results.length > 0 ? this.mapToModel(results[0]) : null;
  }

  async findPending(): Promise<Refund[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'pending'
      ORDER BY createdAt ASC
    `;
    const results = await this.db.query(query);
    return results.map((row: any) => this.mapToModel(row));
  }

  async getTotalRefundedAmount(period?: { start: Date; end: Date }): Promise<number> {
    let query = `
      SELECT SUM(amount) as total FROM ${this.tableName}
      WHERE status = 'processed'
    `;
    const params: any[] = [];

    if (period) {
      query += ` AND processedAt >= ? AND processedAt <= ?`;
      params.push(period.start, period.end);
    }

    const results = await this.db.query(query, params);
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
