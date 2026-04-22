import { BaseRepository } from './BaseRepository';
import { Transaction } from '../models/types';

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super('transactions');
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.findAll({ where: { userId }, sortBy: 'createdAt', sortOrder: 'DESC' });
  }

  async findByRideId(rideId: string): Promise<Transaction | null> {
    return this.findOne({ rideId });
  }
}
