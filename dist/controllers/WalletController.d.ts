import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class WalletController {
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
    getBalance(req: AuthRequest, res: Response): Promise<void>;
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
    getTransactions(req: AuthRequest, res: Response): Promise<void>;
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
    getTransaction(req: AuthRequest, res: Response): Promise<void>;
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
    getStats(req: AuthRequest, res: Response): Promise<void>;
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
    calculateFees(req: AuthRequest, res: Response): Promise<void>;
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
    initiateDeposit(req: AuthRequest, res: Response): Promise<void>;
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
    handlePaymentCallback(req: AuthRequest, res: Response): Promise<void>;
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
    verifyPayment(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: WalletController;
export default _default;
//# sourceMappingURL=WalletController.d.ts.map