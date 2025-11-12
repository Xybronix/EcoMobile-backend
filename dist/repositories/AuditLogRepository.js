"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class AuditLogRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('audit_logs');
    }
    async findByUserId(userId, limit = 100) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `;
        const results = await this.db.query(query, [userId, limit]);
        return results.map((row) => this.mapToModel(row));
    }
    async findByEntity(entity, entityId) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE entity = ? AND entityId = ?
      ORDER BY createdAt DESC
    `;
        const results = await this.db.query(query, [entity, entityId]);
        return results.map((row) => this.mapToModel(row));
    }
    async findByAction(action, limit = 100) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE action = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `;
        const results = await this.db.query(query, [action, limit]);
        return results.map((row) => this.mapToModel(row));
    }
    async findByDateRange(startDate, endDate) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE createdAt >= ? AND createdAt <= ?
      ORDER BY createdAt DESC
    `;
        const results = await this.db.query(query, [startDate, endDate]);
        return results.map((row) => this.mapToModel(row));
    }
    async findFailures(limit = 50) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'failure'
      ORDER BY createdAt DESC
      LIMIT ?
    `;
        const results = await this.db.query(query, [limit]);
        return results.map((row) => this.mapToModel(row));
    }
    async getStatistics(period) {
        let whereClause = '';
        const params = [];
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
    mapToModel(row) {
        return {
            ...row,
            changes: row.changes ? JSON.parse(row.changes) : undefined,
            createdAt: new Date(row.createdAt)
        };
    }
}
exports.AuditLogRepository = AuditLogRepository;
//# sourceMappingURL=AuditLogRepository.js.map