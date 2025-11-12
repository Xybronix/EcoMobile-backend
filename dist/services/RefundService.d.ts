import { Refund } from '../models/types';
export declare class RefundService {
    private refundRepo;
    private notificationService;
    private walletService;
    constructor();
    requestRefund(userId: string, data: {
        rideId?: string;
        transactionId: string;
        amount: number;
        reason: string;
    }): Promise<Refund>;
    approveRefund(refundId: string, processedBy: string, notes?: string): Promise<Refund>;
    rejectRefund(refundId: string, processedBy: string, reason: string): Promise<Refund>;
    private processRefundToWallet;
    getPendingRefunds(): Promise<Refund[]>;
    getUserRefunds(userId: string): Promise<Refund[]>;
    getRefundById(id: string): Promise<Refund | null>;
    getTotalRefundedAmount(period?: {
        start: Date;
        end: Date;
    }): Promise<number>;
}
//# sourceMappingURL=RefundService.d.ts.map