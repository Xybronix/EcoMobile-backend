import express from 'express';
import ChatService from '../services/ChatService';
import { AuthRequest, logActivity } from '../middleware/auth';
import { t } from '../locales';

export class ChatController {
  /**
   * @swagger
   * /chat/messages:
   *   post:
   *     summary: Send a chat message
   *     tags: [Chat]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *     responses:
   *       201:
   *         description: Message sent
   */
  async sendMessage(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { message } = req.body;

      if (!message || message.trim() === '') {
        res.status(400).json({
          success: false,
          error: t('validation.message.required', req.language || 'fr')
        });
        return;
      }

      const chatMessage = await ChatService.sendMessage(userId, message);

      await logActivity(
        userId,
        'CREATE',
        'CHAT_MESSAGE',
        chatMessage.id,
        'Sent chat message',
        { messageLength: message.length },
        req
      );

      res.status(201).json({
        success: true,
        message: t('chat.message_sent', req.language),
        data: chatMessage
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /chat/messages:
   *   get:
   *     summary: Get user's chat messages
   *     tags: [Chat]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Messages retrieved
   */
  async getMessages(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await ChatService.getUserMessages(userId, page, limit);

      await logActivity(
        userId,
        'VIEW',
        'CHAT_MESSAGES',
        '',
        'Viewed chat messages',
        { page, limit, messageCount: result.messages.length },
        req
      );

      res.json({
        success: true,
        message: t('chat.history_retrieved', req.language),
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /chat/messages/{id}:
   *   delete:
   *     summary: Delete a message
   *     tags: [Chat]
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
   *         description: Message deleted
   */
  async deleteMessage(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await ChatService.deleteMessage(id, userId);

      await logActivity(
        userId,
        'DELETE',
        'CHAT_MESSAGE',
        id,
        'Deleted chat message',
        { messageId: id },
        req
      );

      res.json({
        success: true,
        message: 'Message supprimé avec succès'
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /chat/conversations:
   *   get:
   *     summary: Get all chat conversations (Admin only)
   *     tags: [Chat]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Conversations retrieved
   */
  async getAllConversations(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await ChatService.getAllConversations(page, limit);

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'CHAT_CONVERSATIONS',
        '',
        'Viewed all chat conversations',
        { page, limit, conversationCount: result.conversations.length },
        req
      );

      res.json({
        success: true,
        message: 'Conversations récupérées avec succès',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /chat/users/{userId}/messages:
   *   get:
   *     summary: Get messages for a specific user (Admin only)
   *     tags: [Chat]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Messages retrieved
   */
  async getUserMessagesAsAdmin(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await ChatService.getUserMessages(userId, page, limit);

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'USER_CHAT_MESSAGES',
        userId,
        `Viewed chat messages for user ${userId}`,
        { targetUserId: userId, page, limit, messageCount: result.messages.length },
        req
      );

      res.json({
        success: true,
        message: 'Messages récupérés avec succès',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /chat/users/{userId}/messages:
   *   post:
   *     summary: Send message as admin to user
   *     tags: [Chat]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *     responses:
   *       201:
   *         description: Message sent
   */
  async sendMessageAsAdmin(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { message } = req.body;

      if (!message || message.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Le message ne peut pas être vide'
        });
        return;
      }

      const chatMessage = await ChatService.sendMessage(userId, message, true);

      await logActivity(
        req.user?.id || null,
        'CREATE',
        'ADMIN_CHAT_MESSAGE',
        chatMessage.id,
        `Sent admin message to user ${userId}`,
        { targetUserId: userId, messageLength: message.length },
        req
      );

      res.status(201).json({
        success: true,
        message: 'Message envoyé avec succès',
        data: chatMessage
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }
}

export default new ChatController();