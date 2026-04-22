import { BaseRepository } from './BaseRepository';
import { Wallet } from '../models/types';

export class WalletRepository extends BaseRepository<Wallet> {
  constructor() {
    super('wallets');
  }

  async findByUserId(userId: string): Promise<Wallet | null> {
    return this.findOne({ userId });
  }

  async updateBalance(walletId: string, amount: number): Promise<void> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const sql = `UPDATE ${quotedTableName} SET ${this.quoteIdentifier('balance')} = ${this.quoteIdentifier('balance')} + ${this.getPlaceholder(1)}, ${this.quoteIdentifier('updatedAt')} = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [amount, new Date(), walletId]);
  }
}
