export interface PaymentInitiationRequest {
    amount: number;
    userId: string;
    paymentMethod: 'ORANGE_MONEY' | 'MOMO';
    phoneNumber: string;
    description?: string;
}
export interface PaymentResponse {
    success: boolean;
    transactionId: string;
    externalId?: string;
    amount: number;
    fees: number;
    totalAmount: number;
    status: string;
    message?: string;
}
export interface FeeCalculation {
    baseAmount: number;
    coolpayFee: number;
    orangeFee: number;
    totalFees: number;
    totalAmount: number;
}
export declare class PaymentService {
    private coolpayClient;
    constructor();
    /**
     * Calculate fees for a given amount
     * Includes CoolPay fees and Orange Money/MoMo fees
     */
    calculateFees(amount: number): FeeCalculation;
    /**
     * Initiate a deposit payment via My-CoolPay
     */
    initiateDeposit(request: PaymentInitiationRequest): Promise<PaymentResponse>;
    /**
     * Handle payment callback from My-CoolPay
     */
    handlePaymentCallback(callbackData: any): Promise<void>;
    /**
     * Verify payment status with My-CoolPay
     */
    verifyPayment(transactionId: string): Promise<any>;
    /**
     * Process ride payment from wallet
     */
    processRidePayment(userId: string, rideId: string, amount: number): Promise<void>;
    /**
     * Refund a payment
     */
    refundPayment(transactionId: string, reason?: string): Promise<void>;
}
declare const _default: PaymentService;
export default _default;
//# sourceMappingURL=PaymentService.d.ts.map