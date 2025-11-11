import { BaseRepository } from './BaseRepository';
import { PromoCode, PromoCodeUsage } from '../models/types';

export class PromoCodeRepository extends BaseRepository<PromoCode> {
  constructor() {
    super('promo_codes');
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE code = ? AND active = true
      LIMIT 1
    `;
    const results = await this.db.query(query, [code.toUpperCase()]);
    return results.length > 0 ? this.mapToModel(results[0]) : null;
  }

  async findActivePromoCodes(): Promise<PromoCode[]> {
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
    return results.map((row: any) => this.mapToModel(row));
  }

  async incrementUsageCount(id: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET usageCount = usageCount + 1,
          updatedAt = ?
      WHERE id = ?
    `;
    await this.db.query(query, [new Date(), id]);
  }

  protected mapToModel(row: any): PromoCode {
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

export class PromoCodeUsageRepository extends BaseRepository<PromoCodeUsage> {
  constructor() {
    super('promo_code_usages');
  }

  async findByUserId(userId: string): Promise<PromoCodeUsage[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE userId = ?
      ORDER BY usedAt DESC
    `;
    const results = await this.db.query(query, [userId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByPromoCode(promoCodeId: string): Promise<PromoCodeUsage[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE promoCodeId = ?
      ORDER BY usedAt DESC
    `;
    const results = await this.db.query(query, [promoCodeId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async hasUserUsedPromoCode(userId: string, promoCodeId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM ${this.tableName}
      WHERE userId = ? AND promoCodeId = ?
    `;
    const results = await this.db.query(query, [userId, promoCodeId]);
    return results[0].count > 0;
  }

  protected mapToModel(row: any): PromoCodeUsage {
    return {
      ...row,
      usedAt: new Date(row.usedAt)
    };
  }
}
