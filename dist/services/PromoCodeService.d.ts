import { PromoCode, PromoCodeUsage } from '../models/types';
export declare class PromoCodeService {
    private promoCodeRepo;
    private usageRepo;
    constructor();
    createPromoCode(data: Omit<PromoCode, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<PromoCode>;
    validateAndApplyPromoCode(code: string, userId: string, amount: number, bikeType?: string): Promise<{
        valid: boolean;
        discount: number;
        message?: string;
        promoCodeId?: string;
    }>;
    recordPromoCodeUsage(promoCodeId: string, userId: string, discountAmount: number, rideId?: string): Promise<void>;
    getActivePromoCodes(): Promise<PromoCode[]>;
    getUserPromoCodeUsage(userId: string): Promise<PromoCodeUsage[]>;
    getPromoCodeById(id: string): Promise<PromoCode | null>;
    updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<PromoCode>;
    deletePromoCode(id: string): Promise<void>;
    getAllPromoCodes(): Promise<PromoCode[]>;
}
//# sourceMappingURL=PromoCodeService.d.ts.map