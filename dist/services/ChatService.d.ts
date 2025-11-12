export declare class ChatService {
    /**
     * Send a chat message
     */
    sendMessage(userId: string, message: string, isAdmin?: boolean): Promise<{
        user: {
            email: string;
            id: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        message: string;
        isAdmin: boolean;
    }>;
    /**
     * Get chat messages for a user
     */
    getUserMessages(userId: string, page?: number, limit?: number): Promise<{
        messages: ({
            user: {
                email: string;
                id: string;
                firstName: string;
                lastName: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            message: string;
            isAdmin: boolean;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Get all chat conversations (admin)
     */
    getAllConversations(page?: number, limit?: number): Promise<{
        conversations: {
            userId: any;
            userName: any;
            email: any;
            messageCount: number;
            lastMessage: any;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    } | {
        conversations: {
            userId: any;
            userName: string;
            email: any;
            lastMessage: any;
            messageCount: any;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Delete a message
     */
    deleteMessage(messageId: string, userId: string): Promise<void>;
    /**
     * Get message count for user
     */
    getMessageCount(userId: string): Promise<number>;
    /**
     * Mark messages as read (if implementing read status)
     */
    markMessagesAsRead(userId: string, adminId: string): Promise<void>;
}
declare const _default: ChatService;
export default _default;
//# sourceMappingURL=ChatService.d.ts.map