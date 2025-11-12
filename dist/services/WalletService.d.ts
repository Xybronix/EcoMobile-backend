export declare class WalletService {
    /**
     * Get or create wallet for user
     */
    getOrCreateWallet(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        balance: number;
    }>;
    /**
     * Get wallet balance
     */
    getBalance(userId: string): Promise<{
        balance: number;
        walletId: string;
    }>;
    /**
     * Add funds to wallet (for refunds, promotions, etc.)
     * This creates a proper transaction record unlike addBalance
     */
    addFunds(userId: string, amount: number, reason?: string, metadata?: any): Promise<{
        balance: number;
        walletId: string;
    }>;
    /**
     * Get transaction history
     */
    getTransactionHistory(userId: string, page?: number, limit?: number): Promise<{
        transactions: {
            id: string;
            status: import(".prisma/client").$Enums.TransactionStatus;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.TransactionType;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            walletId: string;
            amount: number;
            fees: number;
            totalAmount: number;
            paymentMethod: string | null;
            paymentProvider: string | null;
            externalId: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Get transaction by ID
     */
    getTransactionById(transactionId: string, userId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.TransactionStatus;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TransactionType;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        walletId: string;
        amount: number;
        fees: number;
        totalAmount: number;
        paymentMethod: string | null;
        paymentProvider: string | null;
        externalId: string | null;
    }>;
    /**
     * Check if user has sufficient balance
     */
    hasSufficientBalance(userId: string, amount: number): Promise<boolean>;
    /**
     * Deduct amount from wallet (for ride payments)
     */
    deductBalance(userId: string, amount: number, rideId: string): Promise<{
        balance: number;
        walletId: string;
    }>;
    /**
     * Add balance to wallet (after successful payment)
     * Note: This is a simpler version without transaction record
     */
    addBalance(userId: string, amount: number, _transactionId?: string): Promise<{
        balance: number;
        walletId: string;
    }>;
    /**
     * Get wallet statistics
     */
    getWalletStats(userId: string): Promise<{
        currentBalance: number;
        totalDeposited: number;
        totalSpent: number;
        totalRefunded: number;
        depositCount: number;
        ridePaymentCount: number;
        refundCount: number;
    }>;
}
declare const _default: WalletService;
export default _default;
//# sourceMappingURL=WalletService.d.ts.map