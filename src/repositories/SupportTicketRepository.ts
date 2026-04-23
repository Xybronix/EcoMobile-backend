import { BaseRepository } from './BaseRepository';
import { SupportTicket, TicketMessage } from '../models/types';

export class SupportTicketRepository extends BaseRepository<SupportTicket> {
  constructor() {
    super('support_tickets');
  }

  async findByUserId(userId: string): Promise<SupportTicket[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('userId')} = ${this.getPlaceholder(1)}
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
    `;
    const results = await this.executeQuery(query, [userId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByAssignee(assignedTo: string): Promise<SupportTicket[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('assignedTo')} = ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('status')} NOT IN ('resolved', 'closed')
      ORDER BY ${this.quoteIdentifier('priority')} DESC, ${this.quoteIdentifier('createdAt')} ASC
    `;
    const results = await this.executeQuery(query, [assignedTo]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByStatus(status: string): Promise<SupportTicket[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('status')} = ${this.getPlaceholder(1)}
      ORDER BY ${this.quoteIdentifier('priority')} DESC, ${this.quoteIdentifier('createdAt')} ASC
    `;
    const results = await this.executeQuery(query, [status]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async getStatistics(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    averageResolutionTime: number;
  }> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const countQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ${this.quoteIdentifier('status')} = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN ${this.quoteIdentifier('status')} = 'in_progress' THEN 1 ELSE 0 END) as ${this.quoteIdentifier('inProgress')},
        SUM(CASE WHEN ${this.quoteIdentifier('status')} = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM ${quotedTableName}
    `;
    const countResults = await this.executeQuery(countQuery);

    const timeQuery = `
      SELECT AVG(${this.isMysql() ? 'TIMESTAMPDIFF(HOUR, createdAt, resolvedAt)' : 'EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600'}) as ${this.quoteIdentifier('avgTime')}
      FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('resolvedAt')} IS NOT NULL
    `;
    const timeResults = await this.executeQuery(timeQuery);

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
    const quotedTableName = this.quoteIdentifier(this.tableName);
    let query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('ticketId')} = ${this.getPlaceholder(1)}
    `;
    
    if (!includeInternal) {
      query += ` AND ${this.quoteIdentifier('internal')} = false`;
    }
    
    query += ` ORDER BY ${this.quoteIdentifier('createdAt')} ASC`;
    
    const results = await this.executeQuery(query, [ticketId]);
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
