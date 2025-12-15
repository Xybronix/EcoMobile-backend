import express from 'express';
import BikeRequestController from '../controllers/BikeRequestController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/v1/bike-requests/unlock
 * @desc    Request bike unlock
 * @access  Private
 */
router.post('/unlock', authenticate, BikeRequestController.createUnlockRequest);

/**
 * @route   POST /api/v1/bike-requests/lock
 * @desc    Request bike lock
 * @access  Private
 */
router.post('/lock', authenticate, BikeRequestController.createLockRequest);

/**
 * @route   DELETE /api/v1/bike-requests/unlock/:id
 * @desc    Delete user's unlock request
 * @access  Private
 */
router.delete('/unlock/:id', authenticate, BikeRequestController.deleteUnlockRequest);

/**
 * @route   DELETE /api/v1/bike-requests/lock/:id
 * @desc    Delete user's lock request 
 * @access  Private
 */
router.delete('/lock/:id', authenticate, BikeRequestController.deleteLockRequest);

/**
 * @route   GET /api/v1/unlock-requests/user
 * @desc    Get user's unlock requests
 * @access  Private
 */
router.get('/unlock-requests/user', authenticate, BikeRequestController.getUserUnlockRequests);

/**
 * @route   GET /api/v1/lock-requests/user
 * @desc    Get user's lock requests
 * @access  Private
 */
router.get('/lock-requests/user', authenticate, BikeRequestController.getUserLockRequests);

/**
 * @route   GET /api/v1/bike-requests/user
 * @desc    Get all user requests (unlock + lock)
 * @access  Private
 */
router.get('/user', authenticate, BikeRequestController.getAllUserRequests);

/**
 * @route   GET /api/v1/bike-requests/user/stats
 * @desc    Get user request statistics
 * @access  Private
 */
router.get('/user/stats', authenticate, BikeRequestController.getUserRequestStats);

/**
 * @route   GET /api/v1/bike-requests/:type/:id
 * @desc    Get specific request by ID
 * @access  Private
 */
router.get('/:type/:id', authenticate, BikeRequestController.getRequestById);

/**
 * @route   GET /api/v1/bike-requests/:type/pending
 * @desc    Get pending requests (Admin only)
 * @access  Private/Admin
 */
router.get('/:type/pending', authenticate, requirePermission('bike_requests', 'read'), BikeRequestController.getPendingRequests);

/**
 * @route   GET /api/v1/bike-requests/unlock/pending
 * @desc    Get pending unlock requests (Admin only)
 * @access  Private/Admin
 */
router.get('/unlock/pending', authenticate, requirePermission('bike_requests', 'read'), BikeRequestController.getPendingUnlockRequests);

/**
 * @route   GET /api/v1/bike-requests/lock/pending
 * @desc    Get pending lock requests (Admin only)
 * @access  Private/Admin
 */
router.get('/lock/pending', authenticate, requirePermission('bike_requests', 'read'), BikeRequestController.getPendingLockRequests);

/**
 * @route   POST /api/v1/bike-requests/:type/:id/approve
 * @desc    Approve request (Admin only)
 * @access  Private/Admin
 */
router.post('/:type/:id/approve', authenticate, requirePermission('bike_requests', 'update'), BikeRequestController.approveRequest);

/**
 * @route   POST /api/v1/bike-requests/:type/:id/reject
 * @desc    Reject request (Admin only)
 * @access  Private/Admin
 */
router.post('/:type/:id/reject', authenticate, requirePermission('bike_requests', 'update'), BikeRequestController.rejectRequest);

export default router;