import { prisma } from '../config/prisma';

export class ChatService {
  /**
   * Send a chat message
   */
  async sendMessage(userId: string, message: string, isAdmin: boolean = false) {
    try {
      const chatMessage = await prisma.chatMessage.create({
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
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw new Error('Erreur lors de l\'envoi du message');
    }
  }

  /**
   * Get chat messages for a user
   */
  async getUserMessages(userId: string, page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        prisma.chatMessage.findMany({
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
        prisma.chatMessage.count({ where: { userId } })
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
    } catch (error) {
      console.error('Error in getUserMessages:', error);
      throw new Error('Erreur lors de la récupération des messages');
    }
  }

  /**
   * Get all chat conversations (admin)
   */
  async getAllConversations(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      // Get unique users who have sent messages with their message count and last message
      const usersWithMessages = await prisma.$queryRaw`
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
      ` as any[];

      const total = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        INNER JOIN chat_messages cm ON u.id = cm.userId
      ` as any[];

      // Parse lastMessage JSON if it exists
      const conversations = usersWithMessages.map((user: any) => ({
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
          total: Number((total[0] as any).count),
          totalPages: Math.ceil(Number((total[0] as any).count) / limit)
        }
      };
    } catch (error) {
      console.error('Error in getAllConversations:', error);
      
      // Fallback method using Prisma
      try {
        const users = await prisma.user.findMany({
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

        const total = await prisma.user.count({
          where: {
            chatMessages: {
              some: {}
            }
          }
        });

        return {
          conversations: users.map((user: any) => ({
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
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        throw new Error('Erreur lors de la récupération des conversations');
      }
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      // Verify ownership or admin rights
      const message = await prisma.chatMessage.findFirst({
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

      await prisma.chatMessage.delete({
        where: { id: messageId }
      });
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      throw new Error('Erreur lors de la suppression du message');
    }
  }

  /**
   * Get message count for user
   */
  async getMessageCount(userId: string): Promise<number> {
    try {
      return await prisma.chatMessage.count({
        where: { userId }
      });
    } catch (error) {
      console.error('Error in getMessageCount:', error);
      return 0;
    }
  }

  /**
   * Mark messages as read (if implementing read status)
   */
  async markMessagesAsRead(userId: string, adminId: string): Promise<void> {
    console.log(`Marking messages as read for user ${userId} by admin ${adminId}`);
  }
}

export default new ChatService();