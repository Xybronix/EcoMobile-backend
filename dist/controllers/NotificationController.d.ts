import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
declare class NotificationController {
    private notificationService;
    constructor();
    /**
     * @swagger
     * /notifications:
     *   get:
     *     tags: [Notifications]
     *     summary: Get user notifications
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *       - in: query
     *         name: unreadOnly
     *         schema:
     *           type: boolean
     *           default: false
     *     responses:
     *       200:
     *         description: Notifications retrieved successfully
     */
    getNotifications(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /notifications/unread-count:
     *   get:
     *     tags: [Notifications]
     *     summary: Get unread notifications count
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Unread count retrieved successfully
     */
    getUnreadCount(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /notifications/{id}/read:
     *   put:
     *     tags: [Notifications]
     *     summary: Mark notification as read
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Notification marked as read
     */
    markAsRead(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /notifications/read-all:
     *   put:
     *     tags: [Notifications]
     *     summary: Mark all notifications as read
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: All notifications marked as read
     */
    markAllAsRead(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /notifications/{id}:
     *   delete:
     *     tags: [Notifications]
     *     summary: Delete a notification
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Notification deleted successfully
     */
    deleteNotification(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /notifications/bulk-delete:
     *   post:
     *     tags: [Notifications]
     *     summary: Delete multiple notifications
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - notificationIds
     *             properties:
     *               notificationIds:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Notifications deleted successfully
     */
    bulkDeleteNotifications(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/notifications/send-promotion:
     *   post:
     *     tags: [Admin, Notifications]
     *     summary: Send promotional notification and email to users
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userIds
     *               - subject
     *               - title
     *               - message
     *             properties:
     *               userIds:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: Array of user IDs to send to (empty for all users)
     *               subject:
     *                 type: string
     *               title:
     *                 type: string
     *               message:
     *                 type: string
     *               ctaUrl:
     *                 type: string
     *               sendEmail:
     *                 type: boolean
     *                 default: true
     *     responses:
     *       200:
     *         description: Promotion sent successfully
     */
    sendPromotion(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/notifications/send-bulk-email:
     *   post:
     *     tags: [Admin, Notifications]
     *     summary: Send bulk email to multiple users
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - emails
     *               - subject
     *               - title
     *               - message
     *             properties:
     *               emails:
     *                 type: array
     *                 items:
     *                   type: string
     *               subject:
     *                 type: string
     *               title:
     *                 type: string
     *               message:
     *                 type: string
     *               ctaUrl:
     *                 type: string
     *               ctaText:
     *                 type: string
     *     responses:
     *       200:
     *         description: Bulk emails sent successfully
     */
    sendBulkEmail(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: NotificationController;
export default _default;
//# sourceMappingURL=NotificationController.d.ts.map