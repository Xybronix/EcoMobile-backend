import { BaseRepository } from './BaseRepository';
import { MaintenanceAlert } from '../models/types';

export class MaintenanceAlertRepository extends BaseRepository<MaintenanceAlert> {
  constructor() {
    super('maintenance_alerts');
  }

  async findByBikeId(bikeId: string): Promise<MaintenanceAlert[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('bikeId')} = ${this.getPlaceholder(1)}
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
    `;
    const results = await this.executeQuery(query, [bikeId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findActive(): Promise<MaintenanceAlert[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('status')} = 'active'
      ORDER BY ${this.quoteIdentifier('severity')} DESC, ${this.quoteIdentifier('createdAt')} ASC
    `;
    const results = await this.executeQuery(query);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findBySeverity(severity: string): Promise<MaintenanceAlert[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('severity')} = ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('status')} = 'active'
      ORDER BY ${this.quoteIdentifier('createdAt')} ASC
    `;
    const results = await this.executeQuery(query, [severity]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findCriticalAlerts(): Promise<MaintenanceAlert[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('severity')} = 'critical' AND ${this.quoteIdentifier('status')} = 'active'
      ORDER BY ${this.quoteIdentifier('createdAt')} ASC
    `;
    const results = await this.executeQuery(query);
    return results.map((row: any) => this.mapToModel(row));
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    critical: number;
    byType: { [key: string]: number };
  }> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const countQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ${this.quoteIdentifier('status')} = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN ${this.quoteIdentifier('severity')} = 'critical' AND ${this.quoteIdentifier('status')} = 'active' THEN 1 ELSE 0 END) as critical
      FROM ${quotedTableName}
    `;
    const countResults = await this.executeQuery(countQuery);

    const typeQuery = `
      SELECT ${this.quoteIdentifier('type')}, COUNT(*) as count
      FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('status')} = 'active'
      GROUP BY ${this.quoteIdentifier('type')}
    `;
    const typeResults = await this.executeQuery(typeQuery);

    const byType: { [key: string]: number } = {};
    typeResults.forEach((row: any) => {
      byType[row.type] = row.count;
    });

    return {
      total: countResults[0]?.total || 0,
      active: countResults[0]?.active || 0,
      critical: countResults[0]?.critical || 0,
      byType
    };
  }

  protected mapToModel(row: any): MaintenanceAlert {
    return {
      ...row,
      acknowledgedAt: row.acknowledgedAt ? new Date(row.acknowledgedAt) : undefined,
      resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : undefined,
      createdAt: new Date(row.createdAt)
    };
  }
}
