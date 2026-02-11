import express from 'express';
import NotificationController from '../controllers/NotificationController';
import { authenticate, authenticateSSE, requirePermission } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', authenticate, NotificationController.getNotifications.bind(NotificationController));

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', authenticate, NotificationController.getUnreadCount.bind(NotificationController));

/**
 * @route   GET /api/v1/notifications/stream
 * @desc    Stream notifications in real-time using SSE (Server-Sent Events)
 * @access  Private
 * @note    This endpoint maintains a persistent connection and pushes notifications in real-time
 *          Use this instead of polling /unread-count to reduce server load
 */
router.get('/stream', authenticateSSE, NotificationController.streamNotifications.bind(NotificationController));

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authenticate, NotificationController.markAsRead.bind(NotificationController));

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authenticate, NotificationController.markAllAsRead.bind(NotificationController));

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', authenticate, NotificationController.deleteNotification.bind(NotificationController));

/**
 * @route   POST /api/v1/notifications/bulk-delete
 * @desc    Delete multiple notifications
 * @access  Private
 */
router.post('/bulk-delete', authenticate, NotificationController.bulkDeleteNotifications.bind(NotificationController));

/**
 * @route   POST /api/v1/notifications/send-promotion
 * @desc    Send promotion notification to users
 * @access  Private/Admin
 */
router.post('/send-promotion', authenticate, requirePermission('notifications', 'create'), NotificationController.sendPromotion.bind(NotificationController));

/**
 * @route   POST /api/v1/notifications/send-bulk-email
 * @desc    Send bulk email to users
 * @access  Private/Admin
 */
router.post('/send-bulk-email', authenticate, requirePermission('notifications', 'create'), NotificationController.sendBulkEmail.bind(NotificationController));

export default router;