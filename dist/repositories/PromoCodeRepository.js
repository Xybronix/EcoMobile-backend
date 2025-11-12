"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoCodeUsageRepository = exports.PromoCodeRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class PromoCodeRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('promo_codes');
    }
    async findByCode(code) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE code = ? AND active = true
      LIMIT 1
    `;
        const results = await this.db.query(query, [code.toUpperCase()]);
        return results.length > 0 ? this.mapToModel(results[0]) : null;
    }
    async findActivePromoCodes() {
        const now = new Date();
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE active = true 
      AND validFrom <= ? 
      AND validUntil >= ?
      AND (maxUsageCount IS NULL OR usageCount < maxUsageCount)
      ORDER BY createdAt DESC
    `;
        const results = await this.db.query(query, [now, now]);
        return results.map((row) => this.mapToModel(row));
    }
    async incrementUsageCount(id) {
        const query = `
      UPDATE ${this.tableName}
      SET usageCount = usageCount + 1,
          updatedAt = ?
      WHERE id = ?
    `;
        await this.db.query(query, [new Date(), id]);
    }
    mapToModel(row) {
        return {
            ...row,
            validFrom: new Date(row.validFrom),
            validUntil: new Date(row.validUntil),
            userRestrictions: row.userRestrictions ? JSON.parse(row.userRestrictions) : undefined,
            bikeTypeRestrictions: row.bikeTypeRestrictions ? JSON.parse(row.bikeTypeRestrictions) : undefined,
            active: Boolean(row.active),
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };
    }
}
exports.PromoCodeRepository = PromoCodeRepository;
class PromoCodeUsageRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('promo_code_usages');
    }
    async findByUserId(userId) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE userId = ?
      ORDER BY usedAt DESC
    `;
        const results = await this.db.query(query, [userId]);
        return results.map((row) => this.mapToModel(row));
    }
    async findByPromoCode(promoCodeId) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE promoCodeId = ?
      ORDER BY usedAt DESC
    `;
        const results = await this.db.query(query, [promoCodeId]);
        return results.map((row) => this.mapToModel(row));
    }
    async hasUserUsedPromoCode(userId, promoCodeId) {
        const query = `
      SELECT COUNT(*) as count FROM ${this.tableName}
      WHERE userId = ? AND promoCodeId = ?
    `;
        const results = await this.db.query(query, [userId, promoCodeId]);
        return results[0].count > 0;
    }
    mapToModel(row) {
        return {
            ...row,
            usedAt: new Date(row.usedAt)
        };
    }
}
exports.PromoCodeUsageRepository = PromoCodeUsageRepository;
//# sourceMappingURL=PromoCodeRepository.js.map