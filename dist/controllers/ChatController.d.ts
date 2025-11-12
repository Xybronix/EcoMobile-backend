import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class ChatController {
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
    sendMessage(req: AuthRequest, res: Response): Promise<void>;
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
    getMessages(req: AuthRequest, res: Response): Promise<void>;
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
    deleteMessage(req: AuthRequest, res: Response): Promise<void>;
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
    getAllConversations(req: AuthRequest, res: Response): Promise<void>;
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
    getUserMessagesAsAdmin(req: AuthRequest, res: Response): Promise<void>;
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
    sendMessageAsAdmin(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: ChatController;
export default _default;
//# sourceMappingURL=ChatController.d.ts.map