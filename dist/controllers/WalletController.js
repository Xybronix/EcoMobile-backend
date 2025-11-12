"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const WalletService_1 = __importDefault(require("../services/WalletService"));
const PaymentService_1 = __importDefault(require("../services/PaymentService"));
const auth_1 = require("../middleware/auth");
const locales_1 = require("../locales");
class WalletController {
    /**
     * @swagger
     * /wallet/balance:
     *   get:
     *     summary: Get wallet balance
     *     tags: [Wallet]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Balance retrieved successfully
     */
    async getBalance(req, res) {
        try {
            const userId = req.user.id;
            const balance = await WalletService_1.default.getBalance(userId);
            await (0, auth_1.logActivity)(userId, 'VIEW', 'WALLET_BALANCE', '', 'Viewed wallet balance', { balance: balance.balance }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('wallet.balance_retrieved', req.language),
                data: balance
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    /**
     * @swagger
     * /wallet/transactions:
     *   get:
     *     summary: Get transaction history
     *     tags: [Wallet]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *         description: Items per page
     *     responses:
     *       200:
     *         description: Transaction history retrieved
     */
    async getTransactions(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await WalletService_1.default.getTransactionHistory(userId, page, limit);
            await (0, auth_1.logActivity)(userId, 'VIEW', 'TRANSACTION_HISTORY', '', `Viewed transaction history (page ${page})`, { page, limit, total: result.transactions.length }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('wallet.transaction_history', req.language),
                data: result
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    /**
     * @swagger
     * /wallet/transactions/{id}:
     *   get:
     *     summary: Get transaction by ID
     *     tags: [Wallet]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Transaction retrieved
     */
    async getTransaction(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const transaction = await WalletService_1.default.getTransactionById(id, userId);
            await (0, auth_1.logActivity)(userId, 'VIEW', 'TRANSACTION', id, 'Viewed transaction details', { transactionId: id, amount: transaction.amount, type: transaction.type }, req);
            res.json({
                success: true,
                data: transaction
            });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
    /**
     * @swagger
     * /wallet/stats:
     *   get:
     *     summary: Get wallet statistics
     *     tags: [Wallet]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Statistics retrieved
     */
    async getStats(req, res) {
        try {
            const userId = req.user.id;
            const stats = await WalletService_1.default.getWalletStats(userId);
            await (0, auth_1.logActivity)(userId, 'VIEW', 'WALLET_STATS', '', 'Viewed wallet statistics', {
                totalDeposits: stats.totalDeposited,
                totalSpent: stats.totalSpent,
                currentBalance: stats.currentBalance
            }, req);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    /**
     * @swagger
     * /wallet/deposit/calculate-fees:
     *   post:
     *     summary: Calculate deposit fees
     *     tags: [Wallet]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               amount:
     *                 type: number
     *     responses:
     *       200:
     *         description: Fees calculated
     */
    async calculateFees(req, res) {
        try {
            const { amount } = req.body;
            if (!amount || amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: (0, locales_1.t)('payment.invalid_amount', req.language)
                });
                return;
            }
            const fees = PaymentService_1.default.calculateFees(amount);
            await (0, auth_1.logActivity)(req.user.id, 'VIEW', 'DEPOSIT_FEES', '', 'Calculated deposit fees', { amount, fees: fees.totalFees }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('payment.fees_calculated', req.language, {
                    fees: fees.totalFees,
                    amount: fees.baseAmount
                }),
                data: fees
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    /**
     * @swagger
     * /wallet/deposit:
     *   post:
     *     summary: Initiate wallet deposit
     *     tags: [Wallet, Payments]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - amount
     *               - paymentMethod
     *               - phoneNumber
     *             properties:
     *               amount:
     *                 type: number
     *                 example: 5000
     *               paymentMethod:
     *                 type: string
     *                 enum: [ORANGE_MONEY, MOMO]
     *               phoneNumber:
     *                 type: string
     *                 example: '+237600000000'
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Deposit initiated
     */
    async initiateDeposit(req, res) {
        try {
            const userId = req.user.id;
            const { amount, paymentMethod, phoneNumber, description } = req.body;
            if (!amount || amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: (0, locales_1.t)('payment.invalid_amount', req.language)
                });
                return;
            }
            if (!paymentMethod || !['ORANGE_MONEY', 'MOMO'].includes(paymentMethod)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid payment method'
                });
                return;
            }
            if (!phoneNumber) {
                res.status(400).json({
                    success: false,
                    message: (0, locales_1.t)('validation.field_required', req.language, { field: 'phoneNumber' })
                });
                return;
            }
            const result = await PaymentService_1.default.initiateDeposit({
                amount,
                userId,
                paymentMethod,
                phoneNumber,
                description
            });
            await (0, auth_1.logActivity)(userId, 'CREATE', 'DEPOSIT', result.transactionId, `Initiated deposit of ${amount} FCFA via ${paymentMethod}`, {
                amount,
                paymentMethod,
                transactionId: result.transactionId,
                phoneNumber: phoneNumber.replace(/(\d{4})\d{4}(\d{2})/, '$1****$2') // Masquer partiellement le numéro
            }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('payment.initiated', req.language),
                data: result
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    /**
     * @swagger
     * /wallet/payment/callback:
     *   post:
     *     summary: Handle payment callback from My-CoolPay
     *     tags: [Payments]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Callback processed
     */
    async handlePaymentCallback(req, res) {
        try {
            const callbackData = req.body;
            await PaymentService_1.default.handlePaymentCallback(callbackData);
            await (0, auth_1.logActivity)(null, 'UPDATE', 'PAYMENT_CALLBACK', callbackData.transactionId || '', 'Processed payment callback', {
                transactionId: callbackData.transactionId,
                status: callbackData.status,
                amount: callbackData.amount
            }, req);
            res.json({
                success: true,
                message: 'Callback processed'
            });
        }
        catch (error) {
            console.error('Callback error:', error);
            await (0, auth_1.logActivity)(null, 'ERROR', 'PAYMENT_CALLBACK', req.body.transactionId || '', 'Payment callback processing failed', { error: error.message, callbackData: req.body }, req);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    /**
     * @swagger
     * /wallet/payment/verify/{transactionId}:
     *   get:
     *     summary: Verify payment status
     *     tags: [Payments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: transactionId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Payment status retrieved
     */
    async verifyPayment(req, res) {
        try {
            const { transactionId } = req.params;
            const status = await PaymentService_1.default.verifyPayment(transactionId);
            await (0, auth_1.logActivity)(req.user.id, 'VIEW', 'PAYMENT_STATUS', transactionId, 'Verified payment status', { transactionId, status: status.status }, req);
            res.json({
                success: true,
                data: status
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.WalletController = WalletController;
exports.default = new WalletController();
//# sourceMappingURL=WalletController.js.map