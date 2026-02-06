import express from 'express';
import NotificationService from '../services/NotificationService';
import { notificationSSEService } from '../services/NotificationSSEService';
import { AuthRequest, logActivity } from '../middleware/auth';
import { t } from '../locales';

class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * @swagger
   * /notifications/stream:
   *   get:
   *     tags: [Notifications]
   *     summary: Stream notifications in real-time using SSE
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: token
   *         schema:
   *           type: string
   *         description: JWT token (alternative to Authorization header for SSE compatibility)
   *     responses:
   *       200:
   *         description: SSE stream established
   */
  async streamNotifications(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      // Vérifier l'authentification (peut venir du header ou du query param pour SSE)
      const token = req.query.token as string || req.headers.authorization?.substring(7);
      
      if (!token && !req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Si le token vient du query param, on doit l'authentifier
      let userId: string;
      if (req.user) {
        userId = req.user.id;
      } else if (token) {
        // Authentifier via le token du query param
        const jwt = require('jsonwebtoken');
        const { config } = require('../config/config');
        const decoded = jwt.verify(token, config.jwt.secret);
        userId = decoded.userId;
      } else {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // Ajouter le client au service SSE
      notificationSSEService.addClient(userId, res);

      // Envoyer le nombre initial de notifications non lues
      await notificationSSEService.sendUnreadCount(userId);

      // La connexion restera ouverte jusqu'à ce que le client se déconnecte
      // Le service SSE gère automatiquement les heartbeats et la déconnexion
    } catch (error) {
      console.error('[NotificationController] Error in streamNotifications:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Error establishing SSE connection',
        });
      }
    }
  }

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
  async getNotifications(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unreadOnly === 'true';

      const notifications = await this.notificationService.getUserNotifications(userId, {
        limit,
        offset,
        unreadOnly,
      });

      const unreadCount = await this.notificationService.getUnreadCount(userId);

      await logActivity(
        userId,
        'VIEW',
        'NOTIFICATIONS',
        '',
        'Viewed notifications',
        { limit, offset, unreadOnly, notificationCount: notifications.length, unreadCount },
        req
      );

      res.json({
        success: true,
        message: t('notification.list_retrieved', req.language || 'fr'),
        data: {
          notifications,
          unreadCount,
          total: notifications.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : t('error.internal_server', req.language || 'fr'),
      });
    }
  }

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
  async getUnreadCount(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const unreadCount = await this.notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount },
      });
    } catch (error) {
      res.json({
        success: true,
        data: { unreadCount: 0 },
      });
    }
  }

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
  async markAsRead(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(id);

      if (!notification) {
        res.status(404).json({
          success: false,
          message: t('error.not_found', req.language || 'fr'),
        });
        return;
      }

      await logActivity(
        req.user!.id,
        'UPDATE',
        'NOTIFICATION',
        id,
        'Marked notification as read',
        { notificationId: id, notificationType: notification.type },
        req
      );

      res.json({
        success: true,
        message: t('notification.marked_read', req.language || 'fr'),
        data: notification,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : t('error.internal_server', req.language || 'fr'),
      });
    }
  }

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
  async markAllAsRead(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await this.notificationService.markAllAsRead(userId);

      await logActivity(
        userId,
        'UPDATE',
        'NOTIFICATIONS',
        '',
        'Marked all notifications as read',
        { markedCount: count },
        req
      );

      res.json({
        success: true,
        message: t('notification.all_marked_read', req.language || 'fr'),
        data: { count },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : t('error.internal_server', req.language || 'fr'),
      });
    }
  }

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
  async deleteNotification(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.notificationService.deleteNotification(id);

      if (!success) {
        res.status(404).json({
          success: false,
          message: t('error.not_found', req.language || 'fr'),
        });
        return;
      }

      await logActivity(
        req.user!.id,
        'DELETE',
        'NOTIFICATION',
        id,
        'Deleted notification',
        { notificationId: id },
        req
      );

      res.json({
        success: true,
        message: t('notification.deleted', req.language || 'fr'),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : t('error.internal_server', req.language || 'fr'),
      });
    }
  }

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
  async bulkDeleteNotifications(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { notificationIds } = req.body;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid notification IDs provided',
        });
        return;
      }

      await this.notificationService.bulkDeleteNotifications(notificationIds);

      await logActivity(
        req.user!.id,
        'DELETE',
        'NOTIFICATIONS',
        '',
        'Bulk deleted notifications',
        { notificationIds, count: notificationIds.length },
        req
      );

      res.json({
        success: true,
        message: `${notificationIds.length} notifications supprimées`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : t('error.internal_server', req.language || 'fr'),
      });
    }
  }

  /**
   * @swagger
   * /admin/notifications/send-promotion:
   *   post:
   *     tags: [Notifications]
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
  async sendPromotion(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { userIds, subject, title, message, ctaUrl, sendEmail = true } = req.body;

      // Validate input
      if (!subject || !title || !message) {
        res.status(400).json({
          success: false,
          message: t('error.bad_request', req.language || 'fr'),
        });
        return;
      }

      if (!userIds || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Please provide userIds',
        });
        return;
      }

      const promotionData = {
        subject,
        title,
        message,
        ctaUrl,
      };

      let userEmails;
      if (sendEmail) {
        const { prisma } = await import('../config/prisma');
        const users = await prisma.user.findMany({
          where: {
            id: { in: userIds },
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        });

        userEmails = users.map((user: { id: any; email: any; firstName: any; }) => ({
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lang: 'fr' as 'en' | 'fr',
        }));
      }

      const result = await this.notificationService.sendPromotionToUsers(
        userIds,
        promotionData,
        userEmails
      );

      await logActivity(
        req.user?.id || null,
        'CREATE',
        'PROMOTIONAL_NOTIFICATION',
        '',
        'Sent promotional notifications',
        {
          userIdsCount: userIds.length,
          subject,
          title,
          messageLength: message.length,
          sendEmail,
          notificationsSent: result.notifications,
          emailsSent: result.emailsSent
        },
        req
      );

      res.json({
        success: true,
        message: 'Promotion sent successfully',
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : t('error.internal_server', req.language || 'fr'),
      });
    }
  }

  /**
   * @swagger
   * /admin/notifications/send-bulk-email:
   *   post:
   *     tags: [Notifications]
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
  async sendBulkEmail(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { emails, subject, title, message, ctaUrl, ctaText } = req.body;

      if (!emails || emails.length === 0 || !subject || !title || !message) {
        res.status(400).json({
          success: false,
          message: t('error.bad_request', req.language || 'fr'),
        });
        return;
      }

      const EmailService = (await import('../services/EmailService')).default;
      const emailService = new EmailService();

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
    .content { padding: 30px; background: #f9f9f9; }
    .cta-button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚴 FreeBike</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      <p>${message.replace(/\n/g, '<br>')}</p>
      ${ctaUrl ? `<a href="${ctaUrl}" class="cta-button">${ctaText || 'Learn More'}</a>` : ''}
    </div>
  </div>
</body>
</html>
      `.trim();

      // Send emails individually (since sendBulkEmails might not exist)
      let emailsSent = 0;
      let emailsFailed = 0;

      for (const email of emails) {
        try {
          await emailService.sendEmail({
            to: email,
            subject,
            html,
          });
          emailsSent++;
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          emailsFailed++;
        }
      }

      await logActivity(
        req.user?.id || null,
        'CREATE',
        'BULK_EMAIL',
        '',
        'Sent bulk emails',
        {
          emailsCount: emails.length,
          subject,
          title,
          messageLength: message.length,
          emailsSent,
          emailsFailed
        },
        req
      );

      res.json({
        success: true,
        message: 'Bulk emails processed',
        data: {
          emailsSent,
          emailsFailed,
          total: emails.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : t('error.internal_server', req.language || 'fr'),
      });
    }
  }
}

export default new NotificationController();