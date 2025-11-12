"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
class WalletService {
    /**
     * Get or create wallet for user
     */
    async getOrCreateWallet(userId) {
        let wallet = await prisma_1.prisma.wallet.findUnique({
            where: { userId }
        });
        if (!wallet) {
            wallet = await prisma_1.prisma.wallet.create({
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
    async getBalance(userId) {
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
    async addFunds(userId, amount, reason = 'refund', metadata) {
        const wallet = await this.getOrCreateWallet(userId);
        await prisma_1.prisma.$transaction(async (tx) => {
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
            let transactionType;
            switch (reason) {
                case 'refund':
                    transactionType = client_1.TransactionType.REFUND;
                    break;
                case 'promotion':
                case 'bonus':
                    transactionType = client_1.TransactionType.DEPOSIT;
                    break;
                default:
                    transactionType = client_1.TransactionType.DEPOSIT;
            }
            await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: transactionType,
                    amount,
                    fees: 0,
                    totalAmount: amount,
                    status: client_1.TransactionStatus.COMPLETED,
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
    async getTransactionHistory(userId, page = 1, limit = 20) {
        const wallet = await this.getOrCreateWallet(userId);
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            prisma_1.prisma.transaction.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.prisma.transaction.count({
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
    async getTransactionById(transactionId, userId) {
        const wallet = await this.getOrCreateWallet(userId);
        const transaction = await prisma_1.prisma.transaction.findFirst({
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
    async hasSufficientBalance(userId, amount) {
        const wallet = await this.getOrCreateWallet(userId);
        return wallet.balance >= amount;
    }
    /**
     * Deduct amount from wallet (for ride payments)
     */
    async deductBalance(userId, amount, rideId) {
        const wallet = await this.getOrCreateWallet(userId);
        if (wallet.balance < amount) {
            throw new Error('Insufficient balance');
        }
        await prisma_1.prisma.$transaction(async (tx) => {
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
                    type: client_1.TransactionType.RIDE_PAYMENT,
                    amount,
                    fees: 0,
                    totalAmount: amount,
                    status: client_1.TransactionStatus.COMPLETED,
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
    async addBalance(userId, amount, _transactionId) {
        const wallet = await this.getOrCreateWallet(userId);
        await prisma_1.prisma.wallet.update({
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
    async getWalletStats(userId) {
        const wallet = await this.getOrCreateWallet(userId);
        const [totalDeposits, totalSpent, totalRefunds] = await Promise.all([
            prisma_1.prisma.transaction.aggregate({
                where: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.DEPOSIT,
                    status: client_1.TransactionStatus.COMPLETED
                },
                _sum: { amount: true },
                _count: true
            }),
            prisma_1.prisma.transaction.aggregate({
                where: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.RIDE_PAYMENT,
                    status: client_1.TransactionStatus.COMPLETED
                },
                _sum: { amount: true },
                _count: true
            }),
            prisma_1.prisma.transaction.aggregate({
                where: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.REFUND,
                    status: client_1.TransactionStatus.COMPLETED
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
exports.WalletService = WalletService;
exports.default = new WalletService();
//# sourceMappingURL=WalletService.js.map