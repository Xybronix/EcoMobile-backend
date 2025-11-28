import { PromoCodeRepository, PromoCodeUsageRepository } from '../repositories';
import { PromoCode, PromoCodeUsage } from '../models/types';
import { randomUUID } from 'crypto';

export class PromoCodeService {
  private promoCodeRepo: PromoCodeRepository;
  private usageRepo: PromoCodeUsageRepository;

  constructor() {
    this.promoCodeRepo = new PromoCodeRepository();
    this.usageRepo = new PromoCodeUsageRepository();
  }

  async createPromoCode(data: Omit<PromoCode, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<PromoCode> {
    const promoCode: PromoCode = {
      ...data,
      id: randomUUID(),
      code: data.code.toUpperCase(),
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.promoCodeRepo.create(promoCode);
  }

  async validateAndApplyPromoCode(
    code: string,
    userId: string,
    amount: number,
    bikeType?: string
  ): Promise<{
    valid: boolean;
    discount: number;
    message?: string;
    promoCodeId?: string;
  }> {
    const promoCode = await this.promoCodeRepo.findByCode(code);

    if (!promoCode) {
      return { valid: false, discount: 0, message: 'Invalid promo code' };
    }

    const now = new Date();

    // Check if promo code is active
    if (!promoCode.active) {
      return { valid: false, discount: 0, message: 'Promo code is not active' };
    }

    // Check date validity
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      return { valid: false, discount: 0, message: 'Promo code has expired' };
    }

    // Check usage limit
    if (promoCode.maxUsageCount && promoCode.usageCount >= promoCode.maxUsageCount) {
      return { valid: false, discount: 0, message: 'Promo code usage limit reached' };
    }

    // Check if user already used this promo code
    const hasUsed = await this.usageRepo.hasUserUsedPromoCode(userId, promoCode.id);
    if (hasUsed) {
      return { valid: false, discount: 0, message: 'You have already used this promo code' };
    }

    // Check minimum purchase amount
    if (promoCode.minPurchaseAmount && amount < promoCode.minPurchaseAmount) {
      return { 
        valid: false, 
        discount: 0, 
        message: `Minimum purchase amount is ${promoCode.minPurchaseAmount}` 
      };
    }

    // Check user restrictions
    if (promoCode.userRestrictions && promoCode.userRestrictions.length > 0) {
      if (!promoCode.userRestrictions.includes(userId)) {
        return { valid: false, discount: 0, message: 'This promo code is not available for you' };
      }
    }

    // Check bike type restrictions
    if (bikeType && promoCode.bikeTypeRestrictions && promoCode.bikeTypeRestrictions.length > 0) {
      if (!promoCode.bikeTypeRestrictions.includes(bikeType)) {
        return { valid: false, discount: 0, message: 'This promo code is not valid for this bike type' };
      }
    }

    // Calculate discount
    let discount = 0;
    if (promoCode.type === 'percentage') {
      discount = (amount * promoCode.value) / 100;
      if (promoCode.maxDiscountAmount && discount > promoCode.maxDiscountAmount) {
        discount = promoCode.maxDiscountAmount;
      }
    } else if (promoCode.type === 'fixed') {
      discount = Math.min(promoCode.value, amount);
    } else if (promoCode.type === 'free_ride') {
      discount = amount;
    }

    return {
      valid: true,
      discount: Math.round(discount * 100) / 100,
      promoCodeId: promoCode.id
    };
  }

  async recordPromoCodeUsage(
    promoCodeId: string,
    userId: string,
    discountAmount: number,
    rideId?: string
  ): Promise<void> {
    const usage: PromoCodeUsage = {
      id: randomUUID(),
      promoCodeId,
      userId,
      rideId,
      discountAmount,
      usedAt: new Date()
    };

    await this.usageRepo.create(usage);
    await this.promoCodeRepo.incrementUsageCount(promoCodeId);
  }

  async getActivePromoCodes(): Promise<PromoCode[]> {
    return await this.promoCodeRepo.findActivePromoCodes();
  }

  async getUserPromoCodeUsage(userId: string): Promise<PromoCodeUsage[]> {
    return await this.usageRepo.findByUserId(userId);
  }

  async getPromoCodeById(id: string): Promise<PromoCode | null> {
    return await this.promoCodeRepo.findById(id);
  }

  async updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<PromoCode> {
    const updatedPromoCode = await this.promoCodeRepo.update(id, {
      ...updates,
      updatedAt: new Date()
    });
    
    if (!updatedPromoCode) {
      throw new Error(`Promo code with id ${id} not found`);
    }
    
    return updatedPromoCode;
  }

  async deletePromoCode(id: string): Promise<void> {
    await this.promoCodeRepo.delete(id);
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await this.promoCodeRepo.findAll({});
  }
}
