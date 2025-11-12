"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const NotificationController_1 = __importDefault(require("../controllers/NotificationController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', auth_1.authenticate, NotificationController_1.default.getNotifications.bind(NotificationController_1.default));
/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', auth_1.authenticate, NotificationController_1.default.getUnreadCount.bind(NotificationController_1.default));
/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', auth_1.authenticate, NotificationController_1.default.markAsRead.bind(NotificationController_1.default));
/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', auth_1.authenticate, NotificationController_1.default.markAllAsRead.bind(NotificationController_1.default));
/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', auth_1.authenticate, NotificationController_1.default.deleteNotification.bind(NotificationController_1.default));
/**
 * @route   POST /api/v1/notifications/bulk-delete
 * @desc    Delete multiple notifications
 * @access  Private
 */
router.post('/bulk-delete', auth_1.authenticate, NotificationController_1.default.bulkDeleteNotifications.bind(NotificationController_1.default));
/**
 * @route   POST /api/v1/notifications/send-promotion
 * @desc    Send promotion notification to users
 * @access  Private/Admin
 */
router.post('/send-promotion', auth_1.authenticate, (0, auth_1.requirePermission)('notifications', 'create'), NotificationController_1.default.sendPromotion.bind(NotificationController_1.default));
/**
 * @route   POST /api/v1/notifications/send-bulk-email
 * @desc    Send bulk email to users
 * @access  Private/Admin
 */
router.post('/send-bulk-email', auth_1.authenticate, (0, auth_1.requirePermission)('notifications', 'create'), NotificationController_1.default.sendBulkEmail.bind(NotificationController_1.default));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map