"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class ReviewRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('reviews');
    }
    async findByBikeId(bikeId) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE bikeId = ? AND status = 'approved'
      ORDER BY createdAt DESC
    `;
        const results = await this.db.query(query, [bikeId]);
        return results.map((row) => this.mapToModel(row));
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
    async findPending() {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'pending'
      ORDER BY createdAt ASC
    `;
        const results = await this.db.query(query);
        return results.map((row) => this.mapToModel(row));
    }
    async getAverageRatingByBike(bikeId) {
        const query = `
      SELECT AVG(rating) as avgRating FROM ${this.tableName}
      WHERE bikeId = ? AND status = 'approved'
    `;
        const results = await this.db.query(query, [bikeId]);
        return results[0]?.avgRating || 0;
    }
    async getOverallStatistics() {
        const avgQuery = `
      SELECT AVG(rating) as avgRating, COUNT(*) as total
      FROM ${this.tableName}
      WHERE status = 'approved'
    `;
        const avgResults = await this.db.query(avgQuery);
        const distQuery = `
      SELECT rating, COUNT(*) as count
      FROM ${this.tableName}
      WHERE status = 'approved'
      GROUP BY rating
    `;
        const distResults = await this.db.query(distQuery);
        const ratingDistribution = {};
        distResults.forEach((row) => {
            ratingDistribution[row.rating] = row.count;
        });
        return {
            averageRating: avgResults[0]?.avgRating || 0,
            totalReviews: avgResults[0]?.total || 0,
            ratingDistribution
        };
    }
    mapToModel(row) {
        return {
            ...row,
            respondedAt: row.respondedAt ? new Date(row.respondedAt) : undefined,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };
    }
}
exports.ReviewRepository = ReviewRepository;
//# sourceMappingURL=ReviewRepository.js.map