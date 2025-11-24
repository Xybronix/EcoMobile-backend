import express from 'express';
import SubscriptionController from '../controllers/SubscriptionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/v1/subscriptions/plans
 * @desc    Get available subscription plans
 * @access  Public
 */
router.get('/plans', SubscriptionController.getAvailablePlans);

/**
 * @route   GET /api/v1/subscriptions/current
 * @desc    Get current active subscription
 * @access  Private
 */
router.get('/current', authenticate, SubscriptionController.getCurrentSubscription);

/**
 * @route   POST /api/v1/subscriptions
 * @desc    Subscribe to a plan
 * @access  Private
 */
router.post('/', authenticate, SubscriptionController.subscribe);

/**
 * @route   POST /api/v1/subscriptions/:id/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.post('/:id/cancel', authenticate, SubscriptionController.cancelSubscription);

export default router;