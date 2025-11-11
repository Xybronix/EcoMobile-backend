import { BaseRepository } from './BaseRepository';
import { MaintenanceAlert } from '../models/types';

export class MaintenanceAlertRepository extends BaseRepository<MaintenanceAlert> {
  constructor() {
    super('maintenance_alerts');
  }

  async findByBikeId(bikeId: string): Promise<MaintenanceAlert[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE bikeId = ?
      ORDER BY createdAt DESC
    `;
    const results = await this.db.query(query, [bikeId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findActive(): Promise<MaintenanceAlert[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'active'
      ORDER BY severity DESC, createdAt ASC
    `;
    const results = await this.db.query(query);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findBySeverity(severity: string): Promise<MaintenanceAlert[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE severity = ? AND status = 'active'
      ORDER BY createdAt ASC
    `;
    const results = await this.db.query(query, [severity]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findCriticalAlerts(): Promise<MaintenanceAlert[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE severity = 'critical' AND status = 'active'
      ORDER BY createdAt ASC
    `;
    const results = await this.db.query(query);
    return results.map((row: any) => this.mapToModel(row));
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    critical: number;
    byType: { [key: string]: number };
  }> {
    const countQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN severity = 'critical' AND status = 'active' THEN 1 ELSE 0 END) as critical
      FROM ${this.tableName}
    `;
    const countResults = await this.db.query(countQuery);

    const typeQuery = `
      SELECT type, COUNT(*) as count
      FROM ${this.tableName}
      WHERE status = 'active'
      GROUP BY type
    `;
    const typeResults = await this.db.query(typeQuery);

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
