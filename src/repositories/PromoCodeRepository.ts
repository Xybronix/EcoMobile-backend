import { BaseRepository } from './BaseRepository';
import { PromoCode, PromoCodeUsage } from '../models/types';

export class PromoCodeRepository extends BaseRepository<PromoCode> {
  constructor() {
    super('promo_codes');
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('code')} = ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('active')} = true
      LIMIT 1
    `;
    const results = await this.executeQuery(query, [code.toUpperCase()]);
    return results.length > 0 ? this.mapToModel(results[0]) : null;
  }

  async findActivePromoCodes(): Promise<PromoCode[]> {
    const now = new Date();
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('active')} = true 
      AND ${this.quoteIdentifier('validFrom')} <= ${this.getPlaceholder(1)} 
      AND ${this.quoteIdentifier('validUntil')} >= ${this.getPlaceholder(2)}
      AND (${this.quoteIdentifier('maxUsageCount')} IS NULL OR ${this.quoteIdentifier('usageCount')} < ${this.quoteIdentifier('maxUsageCount')})
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
    `;
    const results = await this.executeQuery(query, [now, now]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async incrementUsageCount(id: string): Promise<void> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      UPDATE ${quotedTableName}
      SET ${this.quoteIdentifier('usageCount')} = ${this.quoteIdentifier('usageCount')} + 1,
          ${this.quoteIdentifier('updatedAt')} = ${this.getPlaceholder(1)}
      WHERE id = ${this.getPlaceholder(2)}
    `;
    await this.executeNonQuery(query, [new Date(), id]);
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
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('userId')} = ${this.getPlaceholder(1)}
      ORDER BY ${this.quoteIdentifier('usedAt')} DESC
    `;
    const results = await this.executeQuery(query, [userId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByPromoCode(promoCodeId: string): Promise<PromoCodeUsage[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('promoCodeId')} = ${this.getPlaceholder(1)}
      ORDER BY ${this.quoteIdentifier('usedAt')} DESC
    `;
    const results = await this.executeQuery(query, [promoCodeId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async hasUserUsedPromoCode(userId: string, promoCodeId: string): Promise<boolean> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT COUNT(*) as count FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('userId')} = ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('promoCodeId')} = ${this.getPlaceholder(2)}
    `;
    const results = await this.executeQuery(query, [userId, promoCodeId]);
    return results[0].count > 0;
  }

  protected mapToModel(row: any): PromoCodeUsage {
    return {
      ...row,
      usedAt: new Date(row.usedAt)
    };
  }
}
