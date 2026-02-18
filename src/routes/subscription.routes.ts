import express from 'express';
import SubscriptionController from '../controllers/SubscriptionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/v1/subscriptions/packages
 * @desc    Get available subscription packages
 * @access  Public
 */
router.get('/packages', SubscriptionController.getAvailablePackages);

/**
 * @route   GET /api/v1/subscriptions/packages/:id
 * @desc    Get package details with formulas
 * @access  Public
 */
router.get('/packages/:id', SubscriptionController.getPackageDetails);

/**
 * @route   GET /api/v1/subscriptions/current
 * @desc    Get current active subscription
 * @access  Private
 */
router.get('/current', authenticate, SubscriptionController.getCurrentSubscription);

/**
 * @route   POST /api/v1/subscriptions
 * @desc    Subscribe to a formula
 * @access  Private
 */
router.post('/', authenticate, SubscriptionController.subscribe);

/**
 * @route   POST /api/v1/subscriptions/:id/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.post('/:id/cancel', authenticate, SubscriptionController.cancelSubscription);

/**
 * @route   POST /api/v1/subscriptions/:id/change
 * @desc    Change subscription to a different formula
 * @access  Private
 */
router.post('/:id/change', authenticate, SubscriptionController.changeSubscription);

export default router;