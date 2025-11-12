"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ChatController_1 = __importDefault(require("../controllers/ChatController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// User chat routes (authenticated users)
router.use(auth_1.authenticate);
/**
 * @route   POST /api/v1/chat/messages
 * @desc    Send a message
 * @access  Private
 */
router.post('/messages', ChatController_1.default.sendMessage);
/**
 * @route   GET /api/v1/chat/messages
 * @desc    Get user's messages
 * @access  Private
 */
router.get('/messages', ChatController_1.default.getMessages);
/**
 * @route   DELETE /api/v1/chat/messages/:id
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/messages/:id', ChatController_1.default.deleteMessage);
/**
 * @route   GET /api/v1/chat/conversations
 * @desc    Get all conversations (Admin only)
 * @access  Private/Admin
 */
router.get('/conversations', (0, auth_1.requirePermission)('chat', 'read'), ChatController_1.default.getAllConversations);
/**
 * @route   GET /api/v1/chat/users/:userId/messages
 * @desc    Get user messages as admin
 * @access  Private/Admin
 */
router.get('/users/:userId/messages', (0, auth_1.requirePermission)('chat', 'read'), ChatController_1.default.getUserMessagesAsAdmin);
/**
 * @route   POST /api/v1/chat/users/:userId/messages
 * @desc    Send message to user as admin
 * @access  Private/Admin
 */
router.post('/users/:userId/messages', (0, auth_1.requirePermission)('chat', 'create'), ChatController_1.default.sendMessageAsAdmin);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map