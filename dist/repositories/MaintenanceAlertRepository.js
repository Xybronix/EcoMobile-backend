"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceAlertRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class MaintenanceAlertRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('maintenance_alerts');
    }
    async findByBikeId(bikeId) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE bikeId = ?
      ORDER BY createdAt DESC
    `;
        const results = await this.db.query(query, [bikeId]);
        return results.map((row) => this.mapToModel(row));
    }
    async findActive() {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'active'
      ORDER BY severity DESC, createdAt ASC
    `;
        const results = await this.db.query(query);
        return results.map((row) => this.mapToModel(row));
    }
    async findBySeverity(severity) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE severity = ? AND status = 'active'
      ORDER BY createdAt ASC
    `;
        const results = await this.db.query(query, [severity]);
        return results.map((row) => this.mapToModel(row));
    }
    async findCriticalAlerts() {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE severity = 'critical' AND status = 'active'
      ORDER BY createdAt ASC
    `;
        const results = await this.db.query(query);
        return results.map((row) => this.mapToModel(row));
    }
    async getStatistics() {
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
        const byType = {};
        typeResults.forEach((row) => {
            byType[row.type] = row.count;
        });
        return {
            total: countResults[0]?.total || 0,
            active: countResults[0]?.active || 0,
            critical: countResults[0]?.critical || 0,
            byType
        };
    }
    mapToModel(row) {
        return {
            ...row,
            acknowledgedAt: row.acknowledgedAt ? new Date(row.acknowledgedAt) : undefined,
            resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : undefined,
            createdAt: new Date(row.createdAt)
        };
    }
}
exports.MaintenanceAlertRepository = MaintenanceAlertRepository;
//# sourceMappingURL=MaintenanceAlertRepository.js.map