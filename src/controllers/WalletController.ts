import express from 'express';
import WalletService from '../services/WalletService';
import PaymentService from '../services/PaymentService';
import { AuthRequest, logActivity } from '../middleware/auth';
import { t } from '../locales';

export class WalletController {
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
  async getBalance(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const balance = await WalletService.getBalance(userId);

      await logActivity(
        userId,
        'VIEW',
        'WALLET_BALANCE',
        '',
        'Viewed wallet balance',
        { balance: balance.balance },
        req
      );
      
      res.json({
        success: true,
        message: t('wallet.balance_retrieved', req.language),
        data: balance
      });
    } catch (error: any) {
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
  async getTransactions(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await WalletService.getTransactionHistory(userId, page, limit);

      await logActivity(
        userId,
        'VIEW',
        'TRANSACTION_HISTORY',
        '',
        `Viewed transaction history (page ${page})`,
        { page, limit, total: result.transactions.length },
        req
      );

      res.json({
        success: true,
        message: t('wallet.transaction_history', req.language),
        data: result
      });
    } catch (error: any) {
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
  async getTransaction(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const transaction = await WalletService.getTransactionById(id, userId);

      await logActivity(
        userId,
        'VIEW',
        'TRANSACTION',
        id,
        'Viewed transaction details',
        { transactionId: id, amount: transaction.amount, type: transaction.type },
        req
      );

      res.json({
        success: true,
        data: transaction
      });
    } catch (error: any) {
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
  async getStats(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const stats = await WalletService.getWalletStats(userId);

      await logActivity(
        userId,
        'VIEW',
        'WALLET_STATS',
        '',
        'Viewed wallet statistics',
        { 
          totalDeposits: stats.totalDeposited, 
          totalSpent: stats.totalSpent,
          currentBalance: stats.currentBalance
        },
        req
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
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
  async calculateFees(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: t('payment.invalid_amount', req.language)
        });
        return;
      }

      const fees = PaymentService.calculateFees(amount);

      await logActivity(
        req.user!.id,
        'VIEW',
        'DEPOSIT_FEES',
        '',
        'Calculated deposit fees',
        { amount, fees: fees.totalFees },
        req
      );

      res.json({
        success: true,
        message: t('payment.fees_calculated', req.language, {
          fees: fees.totalFees,
          amount: fees.baseAmount
        }),
        data: fees
      });
    } catch (error: any) {
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
  async initiateDeposit(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { amount, paymentMethod, phoneNumber, description } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: t('payment.invalid_amount', req.language)
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
          message: t('validation.field_required', req.language, { field: 'phoneNumber' })
        });
        return;
      }

      const result = await PaymentService.initiateDeposit({
        amount,
        userId,
        paymentMethod,
        phoneNumber,
        description
      });

      await logActivity(
        userId,
        'CREATE',
        'DEPOSIT',
        result.transactionId,
        `Initiated deposit of ${amount} FCFA via ${paymentMethod}`,
        { 
          amount, 
          paymentMethod, 
          transactionId: result.transactionId,
          phoneNumber: phoneNumber.replace(/(\d{4})\d{4}(\d{2})/, '$1****$2') // Masquer partiellement le numéro
        },
        req
      );

      res.json({
        success: true,
        message: t('payment.initiated', req.language),
        data: result
      });
    } catch (error: any) {
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
  async handlePaymentCallback(req: AuthRequest, res: express.Response) {
    try {
      const callbackData = req.body;
      await PaymentService.handlePaymentCallback(callbackData);

      await logActivity(
        null,
        'UPDATE',
        'PAYMENT_CALLBACK',
        callbackData.transactionId || '',
        'Processed payment callback',
        { 
          transactionId: callbackData.transactionId,
          status: callbackData.status,
          amount: callbackData.amount
        },
        req
      );

      res.json({
        success: true,
        message: 'Callback processed'
      });
    } catch (error: any) {
      console.error('Callback error:', error);
      
      await logActivity(
        null,
        'ERROR',
        'PAYMENT_CALLBACK',
        req.body.transactionId || '',
        'Payment callback processing failed',
        { error: error.message, callbackData: req.body },
        req
      );

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
  async verifyPayment(req: AuthRequest, res: express.Response) {
    try {
      const { transactionId } = req.params;
      const status = await PaymentService.verifyPayment(transactionId);

      await logActivity(
        req.user!.id,
        'VIEW',
        'PAYMENT_STATUS',
        transactionId,
        'Verified payment status',
        { transactionId, status: status.status },
        req
      );

      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /wallet/payment-methods:
   *   get:
   *     summary: Get available payment methods
   *     description: Retrieve list of supported payment methods for wallet deposits
   *     tags: [Wallet, Payments]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Payment methods retrieved successfully
   */
  async getPaymentMethods(req: AuthRequest, res: express.Response) {
    try {
      const paymentMethods = [
        {
          code: 'ORANGE_MONEY',
          name: 'Orange Money',
          logo: '/assets/logos/orange-money.png',
          fees: {
            percentage: 1.5,
            fixed: 50,
            minimum: 50,
            maximum: 1000
          },
          isActive: true,
          minAmount: 500,
          maxAmount: 1000000,
          description: req.language === 'fr' 
            ? 'Rechargez votre portefeuille via Orange Money'
            : 'Top up your wallet via Orange Money'
        },
        {
          code: 'MOMO',
          name: 'Mobile Money',
          logo: '/assets/logos/momo.png',
          fees: {
            percentage: 1.2,
            fixed: 50,
            minimum: 50,
            maximum: 800
          },
          isActive: true,
          minAmount: 500,
          maxAmount: 1000000,
          description: req.language === 'fr' 
            ? 'Rechargez votre portefeuille via Mobile Money'
            : 'Top up your wallet via Mobile Money'
        }
      ];

      const activeMethods = paymentMethods.filter(method => method.isActive);

      await logActivity(
        req.user!.id,
        'VIEW',
        'PAYMENT_METHODS',
        '',
        'Viewed available payment methods',
        { methodsCount: activeMethods.length },
        req
      );
      
      res.json({
        success: true,
        message: t('payment.methods_retrieved', req.language),
        data: activeMethods
      });
    } catch (error: any) {
      console.error('Error getting payment methods:', error);
      res.status(500).json({
        success: false,
        message: t('common.server_error', req.language)
      });
    }
  }
}

export default new WalletController();