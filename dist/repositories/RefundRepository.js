"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class RefundRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('refunds');
    }
    async findByUserId(userId) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE userId = ?
      ORDER BY createdAt DESC
    `;
        const results = await this.db.query(query, [userId]);
        return results.map((row) => this.mapToModel(row));
    }
    async findByRideId(rideId) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE rideId = ?
      LIMIT 1
    `;
        const results = await this.db.query(query, [rideId]);
        return results.length > 0 ? this.mapToModel(results[0]) : null;
    }
    async findPending() {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'pending'
      ORDER BY createdAt ASC
    `;
        const results = await this.db.query(query);
        return results.map((row) => this.mapToModel(row));
    }
    async getTotalRefundedAmount(period) {
        let query = `
      SELECT SUM(amount) as total FROM ${this.tableName}
      WHERE status = 'processed'
    `;
        const params = [];
        if (period) {
            query += ` AND processedAt >= ? AND processedAt <= ?`;
            params.push(period.start, period.end);
        }
        const results = await this.db.query(query, params);
        return results[0]?.total || 0;
    }
    mapToModel(row) {
        return {
            ...row,
            processedAt: row.processedAt ? new Date(row.processedAt) : undefined,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };
    }
}
exports.RefundRepository = RefundRepository;
//# sourceMappingURL=RefundRepository.js.map