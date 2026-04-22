import { BaseRepository } from './BaseRepository';
import { PricingConfig } from '../models/types';

export class PricingConfigRepository extends BaseRepository<PricingConfig> {
  constructor() {
    super('pricing_configs');
  }

  async findActive(): Promise<PricingConfig[]> {
    return this.findAll({ where: { active: true } });
  }
}
