import express from 'express';
import WalletService from '../services/WalletService';
import PaymentService from '../services/PaymentService';
import { AuthRequest, logActivity } from '../middleware/auth';
import { t } from '../locales';

export class WalletController {
  /**
   * @swagger
   * /wallet/current-subscription:
   *   get:
   *     summary: Get current active subscription
   *     tags: [Wallet]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current subscription retrieved
   */
  async getCurrentSubscription(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const subscription = await WalletService.getCurrentSubscription(userId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Aucun forfait actif trouvé',
          data: null
        });
      }

      await logActivity(
        userId,
        'VIEW',
        'CURRENT_SUBSCRIPTION',
        subscription.id,
        'Viewed current subscription',
        { 
          planName: subscription.planName,
          packageType: subscription.packageType,
          endDate: subscription.endDate 
        },
        req
      );

      return res.json({
        success: true,
        message: 'Forfait actif récupéré avec succès',
        data: subscription
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

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

      if (!paymentMethod || !['ORANGE_MONEY', 'MOMO', 'CASH'].includes(paymentMethod)) {
        res.status(400).json({
          success: false,
          message: 'Invalid payment method'
        });
        return;
      }

      if (paymentMethod !== 'CASH' && !phoneNumber) {
        res.status(400).json({
          success: false,
          message: t('validation.field_required', req.language, { field: 'phoneNumber' })
        });
        return;
      }

      if (paymentMethod === 'CASH') {
        const result = await WalletService.createCashDepositRequest({
          userId,
          amount,
          description: description || 'Demande de recharge en espèces'
        });

        await logActivity(
          userId,
          'CREATE',
          'CASH_DEPOSIT_REQUEST',
          result.id,
          `Created cash deposit request of ${amount} FCFA`,
          { amount, description },
          req
        );

        res.json({ 
          success: true, 
          message: 'Demande de recharge en espèces créée avec succès', 
          data: result 
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
          phoneNumber: phoneNumber.replace(/(\d{4})\d{4}(\d{2})/, '$1****$2')
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
      const paymentMethods = await WalletService.getPaymentMethods(req.language);

      await logActivity(
        req.user!.id,
        'VIEW',
        'PAYMENT_METHODS',
        '',
        'Viewed available payment methods',
        { methodsCount: paymentMethods.length },
        req
      );
      
      res.json({
        success: true,
        message: t('payment.methods_retrieved', req.language),
        data: paymentMethods
      });
    } catch (error: any) {
      console.error('Error getting payment methods:', error);
      res.status(500).json({
        success: false,
        message: t('common.server_error', req.language)
      });
    }
  }

  /**
   * @swagger
   * /wallet/deposit/cash:
   *   post:
   *     summary: Request cash deposit
   *     tags: [Wallet, Cash]
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
   *             properties:
   *               amount:
   *                 type: number
   *                 example: 5000
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Cash deposit request created
   */
  async requestCashDeposit(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { amount, description } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ 
          success: false, 
          message: t('payment.invalid_amount', req.language) 
        });
        return;
      }

      if (amount < 500) {
        res.status(400).json({ 
          success: false, 
          message: 'Le montant minimum pour une recharge en espèces est de 500 FCFA' 
        });
        return;
      }

      const result = await WalletService.createCashDepositRequest({
        userId,
        amount,
        description: description || 'Demande de recharge en espèces'
      });

      await logActivity(
        userId,
        'CREATE',
        'CASH_DEPOSIT_REQUEST',
        result.id,
        `Created cash deposit request of ${amount} FCFA`,
        { amount, description },
        req
      );

      res.json({ 
        success: true, 
        message: 'Demande de recharge en espèces créée avec succès', 
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
   * /wallet/deposit/cash/{id}:
   *   put:
   *     summary: Update cash deposit request amount
   *     tags: [Wallet, Cash]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *             properties:
   *               amount:
   *                 type: number
   *     responses:
   *       200:
   *         description: Cash deposit request updated
   */
  async updateCashDepositRequest(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { amount } = req.body;

      const result = await WalletService.updateCashDepositRequest(id, userId, amount);

      await logActivity(
        userId,
        'UPDATE',
        'CASH_DEPOSIT_REQUEST',
        id,
        `Updated cash deposit request to ${amount} FCFA`,
        { newAmount: amount },
        req
      );

      res.json({ 
        success: true, 
        message: 'Demande de recharge modifiée avec succès', 
        data: result 
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  /**
   * @swagger
   * /wallet/deposit/cash/{id}:
   *   delete:
   *     summary: Cancel cash deposit request
   *     tags: [Wallet, Cash]
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
   *         description: Cash deposit request cancelled
   */
  async cancelCashDepositRequest(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await WalletService.cancelCashDepositRequest(id, userId);

      await logActivity(
        userId,
        'DELETE',
        'CASH_DEPOSIT_REQUEST',
        id,
        'Cancelled cash deposit request',
        null,
        req
      );

      res.json({ 
        success: true, 
        message: 'Demande de recharge annulée avec succès' 
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  /**
   * Get deposit information
   */
  async getDepositInfo(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const depositInfo = await WalletService.getDepositInfo(userId);

      await logActivity(
        userId,
        'VIEW',
        'DEPOSIT_INFO',
        '',
        'Viewed deposit information',
        { currentDeposit: depositInfo.currentDeposit, canUseService: depositInfo.canUseService },
        req
      );

      res.json({
        success: true,
        data: depositInfo
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Recharge deposit
   */
  async rechargeDeposit(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Montant invalide'
        });
      }

      const result = await WalletService.rechargeDeposit(userId, amount);

      await logActivity(
        userId,
        'UPDATE',
        'DEPOSIT_RECHARGE',
        '',
        `Recharged deposit with ${amount} FCFA`,
        { amount },
        req
      );

      return res.json({
        success: true,
        message: 'Caution rechargée avec succès',
        data: result
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Charge user for damage (Admin only)
   */
  async chargeDamage(req: AuthRequest, res: express.Response) {
    try {
      const { userId, amount, description, images } = req.body;
      const adminId = req.user!.id;

      if (!userId || !amount || !description) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes'
        });
      }

      const result = await WalletService.chargeDamage(userId, amount, description, images, adminId);

      await logActivity(
        adminId,
        'CREATE',
        'DAMAGE_CHARGE',
        result.transaction.id,
        `Charged ${amount} FCFA for damage to user ${userId}`,
        { userId, amount, description },
        req
      );

      return res.json({
        success: true,
        message: 'Frais de dégâts appliqués avec succès',
        data: result
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /wallet/admin/transactions:
   *   get:
   *     summary: Get all transactions (Admin only)
   *     tags: [Wallet, Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *       - in: query
   *         name: dateFrom
   *         schema:
   *           type: string
   *       - in: query
   *         name: dateTo
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Transactions retrieved
   */
  async getAllTransactions(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = {
        type: req.query.type as string,
        status: req.query.status as string,
        userId: req.query.userId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      };

      const result = await WalletService.getAllTransactionsAdmin(page, limit, filters);

      await logActivity(
        req.user!.id,
        'VIEW',
        'ADMIN_TRANSACTIONS',
        '',
        'Viewed admin transactions list',
        { page, limit, filters },
        req
      );

      res.json({ 
        success: true, 
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
   * /wallet/admin/cash-deposits/{id}/validate:
   *   post:
   *     summary: Validate cash deposit request (Admin only)
   *     tags: [Wallet, Admin, Cash]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               adminNote:
   *                 type: string
   *     responses:
   *       200:
   *         description: Cash deposit validated
   */
  async validateCashDeposit(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { adminNote } = req.body;

      const result = await WalletService.validateCashDeposit(id, adminId, adminNote);

      await logActivity(
        adminId,
        'UPDATE',
        'CASH_DEPOSIT_VALIDATION',
        id,
        `Validated cash deposit of ${result.amount} FCFA`,
        { 
          transactionId: id, 
          userId: result.wallet.userId, 
          amount: result.amount 
        },
        req
      );

      res.json({ 
        success: true, 
        message: 'Demande de recharge validée avec succès', 
        data: result 
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  /**
   * @swagger
   * /wallet/admin/cash-deposits/{id}/reject:
   *   post:
   *     summary: Reject cash deposit request (Admin only)
   *     tags: [Wallet, Admin, Cash]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Cash deposit rejected
   */
  async rejectCashDeposit(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ 
          success: false, 
          message: 'La raison du rejet est obligatoire' 
        });
        return;
      }

      const result = await WalletService.rejectCashDeposit(id, adminId, reason);

      await logActivity(
        adminId,
        'UPDATE',
        'CASH_DEPOSIT_REJECTION',
        id,
        `Rejected cash deposit of ${result.amount} FCFA`,
        { 
          transactionId: id, 
          userId: result.wallet.userId, 
          reason 
        },
        req
      );

      res.json({ 
        success: true, 
        message: 'Demande de recharge rejetée', 
        data: result 
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  /**
   * @swagger
   * /wallet/admin/stats:
   *   get:
   *     summary: Get global wallet statistics (Admin only)
   *     tags: [Wallet, Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Global statistics retrieved
   */
  async getGlobalWalletStats(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const stats = await WalletService.getGlobalWalletStats();

      await logActivity(
        req.user!.id,
        'VIEW',
        'GLOBAL_WALLET_STATS',
        '',
        'Viewed global wallet statistics',
        { 
          totalBalance: stats.totalBalance,
          totalTransactions: stats.totalTransactions,
          pendingCashRequests: stats.pendingCashRequests
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
   * /wallet/admin/transactions/{id}:
   *   get:
   *     summary: Get transaction details (Admin only)
   *     tags: [Wallet, Admin]
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
   *         description: Transaction details retrieved
   */
  async getAdminTransactionById(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await WalletService.getTransactionByIdAdmin(id);

      await logActivity(
        req.user!.id,
        'VIEW',
        'ADMIN_TRANSACTION_DETAILS',
        id,
        'Viewed transaction details',
        { transactionId: id, userId: transaction.wallet.userId },
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
   * Get user reports
   */
  async getUserReports(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const reports = await WalletService.getUserReports(userId);

      res.json({
        success: true,
        data: reports
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new WalletController();