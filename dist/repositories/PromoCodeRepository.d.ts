import { BaseRepository } from './BaseRepository';
import { PromoCode, PromoCodeUsage } from '../models/types';
export declare class PromoCodeRepository extends BaseRepository<PromoCode> {
    constructor();
    findByCode(code: string): Promise<PromoCode | null>;
    findActivePromoCodes(): Promise<PromoCode[]>;
    incrementUsageCount(id: string): Promise<void>;
    protected mapToModel(row: any): PromoCode;
}
export declare class PromoCodeUsageRepository extends BaseRepository<PromoCodeUsage> {
    constructor();
    findByUserId(userId: string): Promise<PromoCodeUsage[]>;
    findByPromoCode(promoCodeId: string): Promise<PromoCodeUsage[]>;
    hasUserUsedPromoCode(userId: string, promoCodeId: string): Promise<boolean>;
    protected mapToModel(row: any): PromoCodeUsage;
}
//# sourceMappingURL=PromoCodeRepository.d.ts.map