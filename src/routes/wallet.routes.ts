import express from 'express';
import { WalletController } from '../controllers/WalletController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();
const walletController = new WalletController();


/**
 * @route   GET /api/v1/wallet/current-subscription
 * @desc    Get current active subscription
 * @access  Private
 */
router.get('/current-subscription', authenticate, walletController.getCurrentSubscription);

/**
 * @route   GET /api/v1/wallet/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/balance', authenticate, walletController.getBalance);

/**
 * @route   GET /api/v1/wallet/transactions
 * @desc    Get wallet transactions
 * @access  Private
 */
router.get('/transactions', authenticate, walletController.getTransactions);

/**
 * @route   GET /api/v1/wallet/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get('/transactions/:id', authenticate, walletController.getTransaction);

/**
 * @route   GET /api/v1/wallet/stats
 * @desc    Get wallet statistics
 * @access  Private
 */
router.get('/stats', authenticate, walletController.getStats);

/**
 * @route   POST /api/v1/wallet/deposit/calculate-fees
 * @desc    Calculate deposit fees
 * @access  Private
 */
router.post('/deposit/calculate-fees', authenticate, walletController.calculateFees);

/**
 * @route   POST /api/v1/wallet/deposit
 * @desc    Initiate wallet deposit
 * @access  Private
 */
router.post('/deposit', authenticate, walletController.initiateDeposit);

/**
 * @route   POST /api/v1/wallet/payment/callback
 * @desc    Handle payment callback from My-CoolPay
 * @access  Public
 */
router.post('/payment/callback', walletController.handlePaymentCallback);

/**
 * @route   GET /api/v1/wallet/payment/verify/:transactionId
 * @desc    Verify payment status
 * @access  Private
 */
router.get('/payment/verify/:transactionId', authenticate, walletController.verifyPayment);

/**
 * @route   GET /api/v1/wallet/payment-methods
 * @desc    Get list of available payment methods for deposits
 * @access  Private
 */
router.get('/payment-methods', authenticate, walletController.getPaymentMethods);

/**
 * @route POST /api/v1/wallet/deposit/cash
 * @desc Request cash deposit
 * @access Private
 */
router.post('/deposit/cash', authenticate, walletController.requestCashDeposit);

/**
 * @route PUT /api/v1/wallet/deposit/cash/:id
 * @desc Update cash deposit request amount
 * @access Private
 */
router.put('/deposit/cash/:id', authenticate, walletController.updateCashDepositRequest);

/**
 * @route DELETE /api/v1/wallet/deposit/cash/:id
 * @desc Cancel cash deposit request
 * @access Private
 */
router.delete('/deposit/cash/:id', authenticate, walletController.cancelCashDepositRequest);

/**
 * @route GET /api/v1/wallet/admin/transactions
 * @desc Get all transactions (Admin only)
 * @access Private/Admin
 */
router.get('/admin/transactions', authenticate, requirePermission('wallet', 'manage'), walletController.getAllTransactions);

/**
 * @route POST /api/v1/wallet/admin/cash-deposits/:id/validate
 * @desc Validate cash deposit request (Admin only)
 * @access Private/Admin
 */
router.post('/admin/cash-deposits/:id/validate', authenticate, requirePermission('wallet', 'manage'), walletController.validateCashDeposit);

/**
 * @route POST /api/v1/wallet/admin/cash-deposits/:id/reject
 * @desc Reject cash deposit request (Admin only)
 * @access Private/Admin
 */
router.post('/admin/cash-deposits/:id/reject', authenticate, requirePermission('wallet', 'manage'), walletController.rejectCashDeposit);

/**
 * @route   GET /api/v1/wallet/admin/stats
 * @desc    Get global wallet statistics (Admin only)
 * @access  Private/Admin
 */
router.get('/admin/stats', authenticate, requirePermission('wallet', 'read'), walletController.getGlobalWalletStats);

/**
 * @route   GET /api/v1/wallet/admin/transactions/:id
 * @desc    Get transaction details (Admin only)
 * @access  Private/Admin
 */
router.get('/admin/transactions/:id', authenticate, requirePermission('wallet', 'read'), walletController.getAdminTransactionById);

/**
 * @route   GET /api/v1/wallet/deposit-info
 * @desc    Get deposit (caution) information
 * @access  Private
 */
router.get('/deposit-info', authenticate, walletController.getDepositInfo);

/**
 * @route   POST /api/v1/wallet/deposit/recharge
 * @desc    Recharge deposit (caution)
 * @access  Private
 */
router.post('/deposit/recharge', authenticate, walletController.rechargeDeposit);

/**
 * @route   POST /api/v1/wallet/admin/charge-damage
 * @desc    Charge user for bike damage (Admin only)
 * @access  Private/Admin
 */
router.post('/admin/charge-damage', authenticate, requirePermission('wallet', 'manage'), walletController.chargeDamage);

/**
 * @route   GET /api/v1/wallet/admin/user/:userId/balance
 * @desc    Get user wallet balance (Admin only)
 * @access  Private/Admin
 */
router.get('/admin/user/:userId/balance', authenticate, requirePermission('wallet', 'read'), walletController.getUserWalletBalance);

/**
 * @route   GET /api/v1/wallet/admin/user/:userId/deposit-info
 * @desc    Get user deposit info (Admin only)
 * @access  Private/Admin
 */
router.get('/admin/user/:userId/deposit-info', authenticate, requirePermission('wallet', 'read'), walletController.getUserDepositInfo);

export default router;