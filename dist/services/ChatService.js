"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const prisma_1 = require("../config/prisma");
class ChatService {
    /**
     * Send a chat message
     */
    async sendMessage(userId, message, isAdmin = false) {
        try {
            const chatMessage = await prisma_1.prisma.chatMessage.create({
                data: {
                    userId,
                    message,
                    isAdmin
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true
                        }
                    }
                }
            });
            return chatMessage;
        }
        catch (error) {
            console.error('Error in sendMessage:', error);
            throw new Error('Erreur lors de l\'envoi du message');
        }
    }
    /**
     * Get chat messages for a user
     */
    async getUserMessages(userId, page = 1, limit = 50) {
        try {
            const skip = (page - 1) * limit;
            const [messages, total] = await Promise.all([
                prisma_1.prisma.chatMessage.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'asc' },
                    skip,
                    take: limit,
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true
                            }
                        }
                    }
                }),
                prisma_1.prisma.chatMessage.count({ where: { userId } })
            ]);
            return {
                messages,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            console.error('Error in getUserMessages:', error);
            throw new Error('Erreur lors de la récupération des messages');
        }
    }
    /**
     * Get all chat conversations (admin)
     */
    async getAllConversations(page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            // Get unique users who have sent messages with their message count and last message
            const usersWithMessages = await prisma_1.prisma.$queryRaw `
        SELECT DISTINCT
          u.id as userId,
          CONCAT(u.firstName, ' ', u.lastName) as userName,
          u.email,
          COUNT(cm.id) as messageCount,
          (
            SELECT JSON_OBJECT(
              'id', cm2.id,
              'message', cm2.message,
              'isAdmin', cm2.isAdmin,
              'createdAt', cm2.createdAt
            )
            FROM chat_messages cm2 
            WHERE cm2.userId = u.id 
            ORDER BY cm2.createdAt DESC 
            LIMIT 1
          ) as lastMessage
        FROM users u
        INNER JOIN chat_messages cm ON u.id = cm.userId
        GROUP BY u.id, u.firstName, u.lastName, u.email
        ORDER BY MAX(cm.createdAt) DESC
        LIMIT ${limit} OFFSET ${skip}
      `;
            const total = await prisma_1.prisma.$queryRaw `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        INNER JOIN chat_messages cm ON u.id = cm.userId
      `;
            // Parse lastMessage JSON if it exists
            const conversations = usersWithMessages.map((user) => ({
                userId: user.userId,
                userName: user.userName,
                email: user.email,
                messageCount: Number(user.messageCount),
                lastMessage: user.lastMessage ? JSON.parse(user.lastMessage) : null
            }));
            return {
                conversations,
                pagination: {
                    page,
                    limit,
                    total: Number(total[0].count),
                    totalPages: Math.ceil(Number(total[0].count) / limit)
                }
            };
        }
        catch (error) {
            console.error('Error in getAllConversations:', error);
            // Fallback method using Prisma
            try {
                const users = await prisma_1.prisma.user.findMany({
                    where: {
                        chatMessages: {
                            some: {}
                        }
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        chatMessages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            select: {
                                id: true,
                                message: true,
                                isAdmin: true,
                                createdAt: true
                            }
                        },
                        _count: {
                            select: {
                                chatMessages: true
                            }
                        }
                    },
                    skip: (page - 1) * limit,
                    take: limit
                });
                const total = await prisma_1.prisma.user.count({
                    where: {
                        chatMessages: {
                            some: {}
                        }
                    }
                });
                return {
                    conversations: users.map((user) => ({
                        userId: user.id,
                        userName: `${user.firstName} ${user.lastName}`,
                        email: user.email,
                        lastMessage: user.chatMessages[0] || null,
                        messageCount: user._count.chatMessages
                    })),
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                };
            }
            catch (fallbackError) {
                console.error('Fallback method also failed:', fallbackError);
                throw new Error('Erreur lors de la récupération des conversations');
            }
        }
    }
    /**
     * Delete a message
     */
    async deleteMessage(messageId, userId) {
        try {
            // Verify ownership or admin rights
            const message = await prisma_1.prisma.chatMessage.findFirst({
                where: {
                    id: messageId,
                    OR: [
                        { userId }, // User owns the message
                        { isAdmin: true } // Admin message (admin can delete)
                    ]
                }
            });
            if (!message) {
                throw new Error('Message non trouvé ou non autorisé');
            }
            await prisma_1.prisma.chatMessage.delete({
                where: { id: messageId }
            });
        }
        catch (error) {
            console.error('Error in deleteMessage:', error);
            throw new Error('Erreur lors de la suppression du message');
        }
    }
    /**
     * Get message count for user
     */
    async getMessageCount(userId) {
        try {
            return await prisma_1.prisma.chatMessage.count({
                where: { userId }
            });
        }
        catch (error) {
            console.error('Error in getMessageCount:', error);
            return 0;
        }
    }
    /**
     * Mark messages as read (if implementing read status)
     */
    async markMessagesAsRead(userId, adminId) {
        console.log(`Marking messages as read for user ${userId} by admin ${adminId}`);
    }
}
exports.ChatService = ChatService;
exports.default = new ChatService();
//# sourceMappingURL=ChatService.js.map