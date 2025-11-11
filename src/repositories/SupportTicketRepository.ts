import { BaseRepository } from './BaseRepository';
import { SupportTicket, TicketMessage } from '../models/types';

export class SupportTicketRepository extends BaseRepository<SupportTicket> {
  constructor() {
    super('support_tickets');
  }

  async findByUserId(userId: string): Promise<SupportTicket[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE userId = ?
      ORDER BY createdAt DESC
    `;
    const results = await this.db.query(query, [userId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByAssignee(assignedTo: string): Promise<SupportTicket[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE assignedTo = ? AND status NOT IN ('resolved', 'closed')
      ORDER BY priority DESC, createdAt ASC
    `;
    const results = await this.db.query(query, [assignedTo]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByStatus(status: string): Promise<SupportTicket[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = ?
      ORDER BY priority DESC, createdAt ASC
    `;
    const results = await this.db.query(query, [status]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async getStatistics(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    averageResolutionTime: number;
  }> {
    const countQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM ${this.tableName}
    `;
    const countResults = await this.db.query(countQuery);

    const timeQuery = `
      SELECT AVG(TIMESTAMPDIFF(HOUR, createdAt, resolvedAt)) as avgTime
      FROM ${this.tableName}
      WHERE resolvedAt IS NOT NULL
    `;
    const timeResults = await this.db.query(timeQuery);

    return {
      total: countResults[0]?.total || 0,
      open: countResults[0]?.open || 0,
      inProgress: countResults[0]?.inProgress || 0,
      resolved: countResults[0]?.resolved || 0,
      averageResolutionTime: timeResults[0]?.avgTime || 0
    };
  }

  protected mapToModel(row: any): SupportTicket {
    return {
      ...row,
      attachments: row.attachments ? JSON.parse(row.attachments) : undefined,
      resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}

export class TicketMessageRepository extends BaseRepository<TicketMessage> {
  constructor() {
    super('ticket_messages');
  }

  async findByTicketId(ticketId: string, includeInternal: boolean = false): Promise<TicketMessage[]> {
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE ticketId = ?
    `;
    
    if (!includeInternal) {
      query += ` AND internal = false`;
    }
    
    query += ` ORDER BY createdAt ASC`;
    
    const results = await this.db.query(query, [ticketId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  protected mapToModel(row: any): TicketMessage {
    return {
      ...row,
      attachments: row.attachments ? JSON.parse(row.attachments) : undefined,
      internal: Boolean(row.internal),
      createdAt: new Date(row.createdAt)
    };
  }
}
