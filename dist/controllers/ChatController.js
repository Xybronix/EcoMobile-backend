"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const ChatService_1 = __importDefault(require("../services/ChatService"));
const auth_1 = require("../middleware/auth");
const locales_1 = require("../locales");
class ChatController {
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
    async sendMessage(req, res) {
        try {
            const userId = req.user.id;
            const { message } = req.body;
            if (!message || message.trim() === '') {
                res.status(400).json({
                    success: false,
                    message: 'Le message ne peut pas être vide'
                });
                return;
            }
            const chatMessage = await ChatService_1.default.sendMessage(userId, message);
            await (0, auth_1.logActivity)(userId, 'CREATE', 'CHAT_MESSAGE', chatMessage.id, 'Sent chat message', { messageLength: message.length }, req);
            res.status(201).json({
                success: true,
                message: (0, locales_1.t)('chat.message_sent', req.language),
                data: chatMessage
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
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
    async getMessages(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const result = await ChatService_1.default.getUserMessages(userId, page, limit);
            await (0, auth_1.logActivity)(userId, 'VIEW', 'CHAT_MESSAGES', '', 'Viewed chat messages', { page, limit, messageCount: result.messages.length }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('chat.history_retrieved', req.language),
                data: result
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
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
    async deleteMessage(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await ChatService_1.default.deleteMessage(id, userId);
            await (0, auth_1.logActivity)(userId, 'DELETE', 'CHAT_MESSAGE', id, 'Deleted chat message', { messageId: id }, req);
            res.json({
                success: true,
                message: 'Message supprimé avec succès'
            });
        }
        catch (error) {
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
     *     tags: [Chat, Admin]
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
    async getAllConversations(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await ChatService_1.default.getAllConversations(page, limit);
            await (0, auth_1.logActivity)(req.user?.id || null, 'VIEW', 'CHAT_CONVERSATIONS', '', 'Viewed all chat conversations', { page, limit, conversationCount: result.conversations.length }, req);
            res.json({
                success: true,
                message: 'Conversations récupérées avec succès',
                data: result
            });
        }
        catch (error) {
            console.error('Error in getAllConversations:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    /**
     * @swagger
     * /chat/users/{userId}/messages:
     *   get:
     *     summary: Get messages for a specific user (Admin only)
     *     tags: [Chat, Admin]
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
    async getUserMessagesAsAdmin(req, res) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const result = await ChatService_1.default.getUserMessages(userId, page, limit);
            await (0, auth_1.logActivity)(req.user?.id || null, 'VIEW', 'USER_CHAT_MESSAGES', userId, `Viewed chat messages for user ${userId}`, { targetUserId: userId, page, limit, messageCount: result.messages.length }, req);
            res.json({
                success: true,
                message: 'Messages récupérés avec succès',
                data: result
            });
        }
        catch (error) {
            console.error('Error in getUserMessagesAsAdmin:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    /**
     * @swagger
     * /chat/users/{userId}/messages:
     *   post:
     *     summary: Send message as admin to user
     *     tags: [Chat, Admin]
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
    async sendMessageAsAdmin(req, res) {
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
            const chatMessage = await ChatService_1.default.sendMessage(userId, message, true);
            await (0, auth_1.logActivity)(req.user?.id || null, 'CREATE', 'ADMIN_CHAT_MESSAGE', chatMessage.id, `Sent admin message to user ${userId}`, { targetUserId: userId, messageLength: message.length }, req);
            res.status(201).json({
                success: true,
                message: 'Message envoyé avec succès',
                data: chatMessage
            });
        }
        catch (error) {
            console.error('Error in sendMessageAsAdmin:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.ChatController = ChatController;
exports.default = new ChatController();
//# sourceMappingURL=ChatController.js.map