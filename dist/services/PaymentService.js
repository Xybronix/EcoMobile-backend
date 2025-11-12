"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
class PaymentService {
    constructor() {
        this.coolpayClient = axios_1.default.create({
            baseURL: config_1.config.coolpay.apiUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config_1.config.coolpay.apiKey}`,
                'X-Merchant-Id': config_1.config.coolpay.merchantId
            },
            timeout: 30000
        });
    }
    /**
     * Calculate fees for a given amount
     * Includes CoolPay fees and Orange Money/MoMo fees
     */
    calculateFees(amount) {
        const coolpayFee = (amount * config_1.config.coolpay.feePercentage) / 100;
        const orangeFee = (amount * config_1.config.coolpay.orangeFeePercentage) / 100;
        const totalFees = coolpayFee + orangeFee;
        const totalAmount = amount + totalFees;
        return {
            baseAmount: amount,
            coolpayFee: Math.round(coolpayFee),
            orangeFee: Math.round(orangeFee),
            totalFees: Math.round(totalFees),
            totalAmount: Math.round(totalAmount)
        };
    }
    /**
     * Initiate a deposit payment via My-CoolPay
     */
    async initiateDeposit(request) {
        try {
            // Calculate fees
            const feeCalc = this.calculateFees(request.amount);
            // Get merchant number based on payment method
            const merchantNumber = request.paymentMethod === 'ORANGE_MONEY'
                ? process.env.ORANGE_MONEY_NUMBER
                : process.env.MOMO_NUMBER;
            if (!merchantNumber) {
                throw new Error('Merchant number not configured for this payment method');
            }
            // Create transaction record first
            const wallet = await prisma_1.prisma.wallet.findUnique({
                where: { userId: request.userId }
            });
            if (!wallet) {
                throw new Error('Wallet not found');
            }
            const transaction = await prisma_1.prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: client_1.TransactionType.DEPOSIT,
                    amount: feeCalc.baseAmount,
                    fees: feeCalc.totalFees,
                    totalAmount: feeCalc.totalAmount,
                    status: client_1.TransactionStatus.PENDING,
                    paymentMethod: request.paymentMethod,
                    paymentProvider: 'MY_COOLPAY',
                    metadata: {
                        phoneNumber: request.phoneNumber,
                        merchantNumber: merchantNumber,
                        description: request.description || 'Wallet recharge'
                    }
                }
            });
            // Call My-CoolPay API
            const coolpayResponse = await this.coolpayClient.post('/payments/initiate', {
                merchant_id: config_1.config.coolpay.merchantId,
                transaction_id: transaction.id,
                amount: feeCalc.totalAmount,
                currency: 'XAF',
                payment_method: request.paymentMethod === 'ORANGE_MONEY' ? 'orange_money' : 'mtn_momo',
                customer_phone: request.phoneNumber,
                merchant_phone: merchantNumber,
                description: request.description || 'FreeBike Wallet Recharge',
                callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/callback`,
                return_url: `${config_1.config.app.frontendUrl}/wallet?payment=success`,
                cancel_url: `${config_1.config.app.frontendUrl}/wallet?payment=cancelled`
            });
            // Update transaction with external ID
            await prisma_1.prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    externalId: coolpayResponse.data.payment_id || coolpayResponse.data.transaction_id,
                    metadata: {
                        ...transaction.metadata,
                        coolpayResponse: coolpayResponse.data
                    }
                }
            });
            return {
                success: true,
                transactionId: transaction.id,
                externalId: coolpayResponse.data.payment_id || coolpayResponse.data.transaction_id,
                amount: feeCalc.baseAmount,
                fees: feeCalc.totalFees,
                totalAmount: feeCalc.totalAmount,
                status: 'PENDING',
                message: 'Payment initiated. Please complete the payment on your phone.'
            };
        }
        catch (error) {
            console.error('Payment initiation error:', error);
            // Log error details
            if (error.response) {
                console.error('CoolPay API Error:', error.response.data);
            }
            throw new Error(error.response?.data?.message || error.message || 'Payment initiation failed');
        }
    }
    /**
     * Handle payment callback from My-CoolPay
     */
    async handlePaymentCallback(callbackData) {
        try {
            const transactionId = callbackData.transaction_id || callbackData.merchant_reference;
            const status = callbackData.status || callbackData.payment_status;
            const externalId = callbackData.payment_id || callbackData.coolpay_transaction_id;
            const transaction = await prisma_1.prisma.transaction.findUnique({
                where: { id: transactionId },
                include: { wallet: true }
            });
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            // Update transaction status based on callback
            if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'success') {
                // Payment successful - credit wallet
                await prisma_1.prisma.$transaction(async (tx) => {
                    // Update transaction status
                    await tx.transaction.update({
                        where: { id: transactionId },
                        data: {
                            status: client_1.TransactionStatus.COMPLETED,
                            externalId: externalId,
                            metadata: {
                                ...transaction.metadata,
                                callback: callbackData,
                                completedAt: new Date().toISOString()
                            }
                        }
                    });
                    // Credit wallet
                    await tx.wallet.update({
                        where: { id: transaction.walletId },
                        data: {
                            balance: {
                                increment: transaction.amount
                            }
                        }
                    });
                    // Create notification
                    await tx.notification.create({
                        data: {
                            userId: transaction.wallet.userId,
                            title: 'Deposit Successful',
                            message: `Your wallet has been credited with ${transaction.amount} XAF`,
                            type: 'PAYMENT'
                        }
                    });
                });
            }
            else if (status === 'FAILED' || status === 'failed' || status === 'REJECTED') {
                // Payment failed
                await prisma_1.prisma.transaction.update({
                    where: { id: transactionId },
                    data: {
                        status: client_1.TransactionStatus.FAILED,
                        metadata: {
                            ...transaction.metadata,
                            callback: callbackData,
                            failedAt: new Date().toISOString()
                        }
                    }
                });
                // Create notification
                await prisma_1.prisma.notification.create({
                    data: {
                        userId: transaction.wallet.userId,
                        title: 'Deposit Failed',
                        message: `Your deposit of ${transaction.totalAmount} XAF has failed`,
                        type: 'PAYMENT'
                    }
                });
            }
            else {
                // Update with current status
                await prisma_1.prisma.transaction.update({
                    where: { id: transactionId },
                    data: {
                        metadata: {
                            ...transaction.metadata,
                            callback: callbackData
                        }
                    }
                });
            }
        }
        catch (error) {
            console.error('Payment callback handling error:', error);
            throw error;
        }
    }
    /**
     * Verify payment status with My-CoolPay
     */
    async verifyPayment(transactionId) {
        try {
            const transaction = await prisma_1.prisma.transaction.findUnique({
                where: { id: transactionId }
            });
            if (!transaction || !transaction.externalId) {
                throw new Error('Transaction not found or no external ID');
            }
            const response = await this.coolpayClient.get(`/payments/status/${transaction.externalId}`);
            return response.data;
        }
        catch (error) {
            console.error('Payment verification error:', error);
            throw new Error(error.response?.data?.message || 'Payment verification failed');
        }
    }
    /**
     * Process ride payment from wallet
     */
    async processRidePayment(userId, rideId, amount) {
        try {
            await prisma_1.prisma.$transaction(async (tx) => {
                const wallet = await tx.wallet.findUnique({
                    where: { userId }
                });
                if (!wallet) {
                    throw new Error('Wallet not found');
                }
                if (wallet.balance < amount) {
                    throw new Error('Insufficient balance');
                }
                // Deduct from wallet
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: {
                        balance: {
                            decrement: amount
                        }
                    }
                });
                // Create transaction record
                await tx.transaction.create({
                    data: {
                        walletId: wallet.id,
                        type: client_1.TransactionType.RIDE_PAYMENT,
                        amount: amount,
                        fees: 0,
                        totalAmount: amount,
                        status: client_1.TransactionStatus.COMPLETED,
                        paymentMethod: 'WALLET',
                        metadata: {
                            rideId: rideId,
                            paidAt: new Date().toISOString()
                        }
                    }
                });
            });
        }
        catch (error) {
            console.error('Ride payment error:', error);
            throw error;
        }
    }
    /**
     * Refund a payment
     */
    async refundPayment(transactionId, reason) {
        try {
            await prisma_1.prisma.$transaction(async (tx) => {
                const originalTransaction = await tx.transaction.findUnique({
                    where: { id: transactionId },
                    include: { wallet: true }
                });
                if (!originalTransaction) {
                    throw new Error('Transaction not found');
                }
                if (originalTransaction.status !== client_1.TransactionStatus.COMPLETED) {
                    throw new Error('Only completed transactions can be refunded');
                }
                // Credit wallet
                await tx.wallet.update({
                    where: { id: originalTransaction.walletId },
                    data: {
                        balance: {
                            increment: originalTransaction.amount
                        }
                    }
                });
                // Create refund transaction
                await tx.transaction.create({
                    data: {
                        walletId: originalTransaction.walletId,
                        type: client_1.TransactionType.REFUND,
                        amount: originalTransaction.amount,
                        fees: 0,
                        totalAmount: originalTransaction.amount,
                        status: client_1.TransactionStatus.COMPLETED,
                        metadata: {
                            originalTransactionId: transactionId,
                            reason: reason || 'Refund',
                            refundedAt: new Date().toISOString()
                        }
                    }
                });
                // Create notification
                await tx.notification.create({
                    data: {
                        userId: originalTransaction.wallet.userId,
                        title: 'Refund Processed',
                        message: `A refund of ${originalTransaction.amount} XAF has been credited to your wallet`,
                        type: 'PAYMENT'
                    }
                });
            });
        }
        catch (error) {
            console.error('Refund error:', error);
            throw error;
        }
    }
}
exports.PaymentService = PaymentService;
exports.default = new PaymentService();
//# sourceMappingURL=PaymentService.js.map