"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = __importDefault(require("../controllers/UserController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', auth_1.authenticate, UserController_1.default.getProfile);
/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth_1.authenticate, UserController_1.default.updateProfile);
/**
 * @route   PUT /api/v1/users/password
 * @desc    Update user password
 * @access  Private
 */
router.put('/password', auth_1.authenticate, UserController_1.default.updatePassword);
/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', auth_1.authenticate, UserController_1.default.getStats);
/**
 * @route   GET /api/v1/users/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/notifications', auth_1.authenticate, UserController_1.default.getNotifications);
/**
 * @route   POST /api/v1/users/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/notifications/:id/read', auth_1.authenticate, UserController_1.default.markNotificationAsRead);
/**
 * @route   POST /api/v1/users/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/notifications/read-all', auth_1.authenticate, UserController_1.default.markAllNotificationsAsRead);
/**
 * @route   GET /api/v1/users/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/notifications/unread-count', auth_1.authenticate, UserController_1.default.getUnreadCount);
/**
 * @route   GET /api/v1/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/', auth_1.authenticate, (0, auth_1.requirePermission)('users', 'read'), UserController_1.default.getAllUsers);
/**
 * @route   POST /api/v1/users
 * @desc    Create new user/employee (Admin only)
 * @access  Private/Admin
 */
router.post('/', auth_1.authenticate, (0, auth_1.requirePermission)('users', 'create'), UserController_1.default.createUser);
/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user (Admin only)
 * @access  Private/Admin
 */
router.put('/:id', auth_1.authenticate, (0, auth_1.requirePermission)('users', 'update'), UserController_1.default.updateUser);
/**
 * @route   GET /api/v1/users/search
 * @desc    Search users (Admin only)
 * @access  Private/Admin
 */
router.get('/search', auth_1.authenticate, (0, auth_1.requirePermission)('users', 'read'), UserController_1.default.searchUsers);
/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private/Admin
 */
router.get('/:id', auth_1.authenticate, (0, auth_1.requirePermission)('users', 'read'), UserController_1.default.getUserById);
/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Update user role (Admin only)
 * @access  Private/Admin
 */
router.put('/:id/role', auth_1.authenticate, (0, auth_1.requirePermission)('users', 'update'), UserController_1.default.updateUserRole);
/**
 * @route   PUT /api/v1/users/:id/status
 * @desc    Toggle user status (Admin only)
 * @access  Private/Admin
 */
router.put('/:id/status', auth_1.authenticate, (0, auth_1.requirePermission)('users', 'update'), UserController_1.default.toggleUserStatus);
/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', auth_1.authenticate, (0, auth_1.requirePermission)('users', 'delete'), UserController_1.default.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map