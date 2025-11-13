import express from 'express';
import ChatController from '../controllers/ChatController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

// User chat routes (authenticated users)
router.use(authenticate);

/**
 * @route   POST /api/v1/chat/messages
 * @desc    Send a message
 * @access  Private
 */
router.post('/messages', ChatController.sendMessage);

/**
 * @route   GET /api/v1/chat/messages
 * @desc    Get user's messages
 * @access  Private
 */
router.get('/messages', ChatController.getMessages);

/**
 * @route   DELETE /api/v1/chat/messages/:id
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/messages/:id', ChatController.deleteMessage);

/**
 * @route   GET /api/v1/chat/conversations
 * @desc    Get all conversations (Admin only)
 * @access  Private/Admin
 */
router.get('/conversations', requirePermission('chat', 'read'), ChatController.getAllConversations);

/**
 * @route   GET /api/v1/chat/users/:userId/messages
 * @desc    Get user messages as admin
 * @access  Private/Admin
 */
router.get('/users/:userId/messages', requirePermission('chat', 'read'), ChatController.getUserMessagesAsAdmin);

/**
 * @route   POST /api/v1/chat/users/:userId/messages
 * @desc    Send message to user as admin
 * @access  Private/Admin
 */
router.post('/users/:userId/messages', requirePermission('chat', 'create'), ChatController.sendMessageAsAdmin);

export default router;