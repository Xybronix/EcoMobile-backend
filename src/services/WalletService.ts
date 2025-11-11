import { prisma } from '../config/prisma';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class WalletService {
  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0
        }
      });
    }

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      balance: wallet.balance,
      walletId: wallet.id
    };
  }

  /**
   * Add funds to wallet (for refunds, promotions, etc.)
   * This creates a proper transaction record unlike addBalance
   */
  async addFunds(
    userId: string, 
    amount: number, 
    reason: string = 'refund',
    metadata?: any
  ) {
    const wallet = await this.getOrCreateWallet(userId);

    await prisma.$transaction(async (tx) => {
      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: amount
          }
        }
      });

      // Create transaction record based on reason
      let transactionType: TransactionType;
      
      switch (reason) {
        case 'refund':
          transactionType = TransactionType.REFUND;
          break;
        case 'promotion':
        case 'bonus':
          transactionType = TransactionType.DEPOSIT;
          break;
        default:
          transactionType = TransactionType.DEPOSIT;
      }

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: transactionType,
          amount,
          fees: 0,
          totalAmount: amount,
          status: TransactionStatus.COMPLETED,
          paymentMethod: 'SYSTEM',
          paymentProvider: 'INTERNAL',
          metadata: {
            reason,
            ...metadata
          }
        }
      });
    });

    return await this.getBalance(userId);
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, page: number = 1, limit: number = 20) {
    const wallet = await this.getOrCreateWallet(userId);

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({
        where: { walletId: wallet.id }
      })
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string, userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        walletId: wallet.id
      }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance >= amount;
  }

  /**
   * Deduct amount from wallet (for ride payments)
   */
  async deductBalance(userId: string, amount: number, rideId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: amount
          }
        }
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.RIDE_PAYMENT,
          amount,
          fees: 0,
          totalAmount: amount,
          status: TransactionStatus.COMPLETED,
          paymentMethod: 'WALLET',
          metadata: { rideId }
        }
      });
    });

    return await this.getBalance(userId);
  }

  /**
   * Add balance to wallet (after successful payment)
   * Note: This is a simpler version without transaction record
   */
  async addBalance(userId: string, amount: number, _transactionId?: string) {
    const wallet = await this.getOrCreateWallet(userId);

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    return await this.getBalance(userId);
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const [totalDeposits, totalSpent, totalRefunds] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          walletId: wallet.id,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.aggregate({
        where: {
          walletId: wallet.id,
          type: TransactionType.RIDE_PAYMENT,
          status: TransactionStatus.COMPLETED
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.transaction.aggregate({
        where: {
          walletId: wallet.id,
          type: TransactionType.REFUND,
          status: TransactionStatus.COMPLETED
        },
        _sum: { amount: true },
        _count: true
      })
    ]);

    return {
      currentBalance: wallet.balance,
      totalDeposited: totalDeposits._sum.amount || 0,
      totalSpent: totalSpent._sum.amount || 0,
      totalRefunded: totalRefunds._sum.amount || 0,
      depositCount: totalDeposits._count,
      ridePaymentCount: totalSpent._count,
      refundCount: totalRefunds._count
    };
  }
}

export default new WalletService();
