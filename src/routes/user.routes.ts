import express from 'express';
import UserController from '../controllers/UserController';
<<<<<<< HEAD
import { authenticate, authenticateWithPendingVerification, requirePermission } from '../middleware/auth';
=======
import { authenticate, requirePermission } from '../middleware/auth';
>>>>>>> origin/main

const router = express.Router();

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.get('/profile', authenticateWithPendingVerification, UserController.getProfile);
=======
 * @access  Private
 */
router.get('/profile', authenticate, UserController.getProfile);
>>>>>>> origin/main

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.put('/profile', authenticateWithPendingVerification, UserController.updateProfile);
=======
 * @access  Private
 */
router.put('/profile', authenticate, UserController.updateProfile);
>>>>>>> origin/main

/**
 * @route   PUT /api/v1/users/password
 * @desc    Update user password
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.put('/password', authenticateWithPendingVerification, UserController.updatePassword);
=======
 * @access  Private
 */
router.put('/password', authenticate, UserController.updatePassword);
>>>>>>> origin/main

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', authenticate, UserController.getStats);

/**
 * @route   GET /api/v1/users/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/notifications', authenticate, UserController.getNotifications);

/**
 * @route   POST /api/v1/users/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/notifications/:id/read', authenticate, UserController.markNotificationAsRead);

/**
 * @route   POST /api/v1/users/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/notifications/read-all', authenticate, UserController.markAllNotificationsAsRead);

/**
 * @route   GET /api/v1/users/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/notifications/unread-count', authenticate, UserController.getUnreadCount);

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Delete user account (archive)
 * @access  Private
 */
router.delete('/account', authenticate, UserController.deleteAccount);

/**
 * @route   GET /api/v1/users/preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/preferences', authenticate, UserController.getPreferences);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put('/preferences', authenticate, UserController.updatePreferences);

/**
 * @route   POST /api/v1/users/push-token
 * @desc    Register push notification token
 * @access  Private
 */
router.post('/push-token', authenticate, UserController.registerPushToken);

/**
 * @route   DELETE /api/v1/users/push-token
 * @desc    Unregister push notification token
 * @access  Private
 */
router.delete('/push-token', authenticate, UserController.unregisterPushToken);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, requirePermission('users', 'read'), UserController.getAllUsers);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user/employee (Admin only)
 * @access  Private/Admin
 */
router.post('/', authenticate, requirePermission('users', 'create'), UserController.createUser);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user (Admin only)
 * @access  Private/Admin
 */
router.put('/:id', authenticate, requirePermission('users', 'update'), UserController.updateUser);

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users (Admin only)
 * @access  Private/Admin
 */
router.get('/search', authenticate, requirePermission('users', 'read'), UserController.searchUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private/Admin
 */
router.get('/:id', authenticate, requirePermission('users', 'read'), UserController.getUserById);

/**
 * @route   GET /api/v1/admin/users/:id/incidents
 * @desc    Get user incidents (Admin only)
 * @access  Private/Admin
 */
router.get('/:id/incidents', authenticate, requirePermission('users', 'read'), UserController.getUserIncidents);

/**
 * @route   GET /api/v1/admin/users/:id/rides
 * @desc    Get user rides (Admin only)
 * @access  Private/Admin
 */
router.get('/:id/rides', authenticate, requirePermission('users', 'read'), UserController.getUserRides);

/**
 * @route   GET /api/v1/admin/users/:id/transactions
 * @desc    Get user transactions (Admin only)
 * @access  Private/Admin
 */
router.get('/:id/transactions', authenticate, requirePermission('wallet', 'read'), UserController.getUserTransactions);

/**
 * @route   GET /api/v1/admin/users/:id/requests
 * @desc    Get user unlock/lock requests (Admin only)
 * @access  Private/Admin
 */
router.get('/:id/requests', authenticate, requirePermission('users', 'read'), UserController.getUserRequests);

/**
 * @route   GET /api/v1/admin/users/:id/stats
 * @desc    Get user statistics (Admin only)
 * @access  Private/Admin
 */
router.get('/:id/stats', authenticate, requirePermission('users', 'read'), UserController.getUserStats);

/**
 * @route   GET /api/v1/admin/users/:id/subscription
 * @desc    Get user active subscription (Admin only)
 * @access  Private/Admin
 */
router.get('/:id/subscription', authenticate, requirePermission('users', 'read'), UserController.getUserActiveSubscription);

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Update user role (Admin only)
 * @access  Private/Admin
 */
router.put('/:id/role', authenticate, requirePermission('users', 'update'), UserController.updateUserRole);

/**
 * @route   PUT /api/v1/users/:id/status
 * @desc    Toggle user status (Admin only)
 * @access  Private/Admin
 */
router.put('/:id/status', authenticate, requirePermission('users', 'update'), UserController.toggleUserStatus);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, requirePermission('users', 'delete'), UserController.deleteUser);

export default router;