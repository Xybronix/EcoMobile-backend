import express from 'express';
import { WalletController } from '../controllers/WalletController';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const walletController = new WalletController();


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

export default router;