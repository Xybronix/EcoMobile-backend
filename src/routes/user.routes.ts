import { Router } from 'express';
import UserController from '../controllers/UserController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, UserController.getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, UserController.updateProfile);

/**
 * @route   PUT /api/v1/users/password
 * @desc    Update user password
 * @access  Private
 */
router.put('/password', authenticate, UserController.updatePassword);

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