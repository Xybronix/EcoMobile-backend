"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WalletController_1 = require("../controllers/WalletController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const walletController = new WalletController_1.WalletController();
/**
 * @route   GET /api/v1/wallet/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/balance', auth_1.authenticate, walletController.getBalance);
/**
 * @route   GET /api/v1/wallet/transactions
 * @desc    Get wallet transactions
 * @access  Private
 */
router.get('/transactions', auth_1.authenticate, walletController.getTransactions);
/**
 * @route   GET /api/v1/wallet/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get('/transactions/:id', auth_1.authenticate, walletController.getTransaction);
/**
 * @route   GET /api/v1/wallet/stats
 * @desc    Get wallet statistics
 * @access  Private
 */
router.get('/stats', auth_1.authenticate, walletController.getStats);
/**
 * @route   POST /api/v1/wallet/deposit/calculate-fees
 * @desc    Calculate deposit fees
 * @access  Private
 */
router.post('/deposit/calculate-fees', auth_1.authenticate, walletController.calculateFees);
/**
 * @route   POST /api/v1/wallet/deposit
 * @desc    Initiate wallet deposit
 * @access  Private
 */
router.post('/deposit', auth_1.authenticate, walletController.initiateDeposit);
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
router.get('/payment/verify/:transactionId', auth_1.authenticate, walletController.verifyPayment);
exports.default = router;
//# sourceMappingURL=wallet.routes.js.map