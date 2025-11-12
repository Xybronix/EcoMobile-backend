import { BaseRepository } from './BaseRepository';
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
}
export interface CreateNotificationDTO {
    userId: string;
    title: string;
    message: string;
    type: string;
}
declare class NotificationRepository extends BaseRepository<Notification> {
    constructor();
    /**
     * Get all notifications for a user
     */
    findByUserId(userId: string, options?: {
        limit?: number;
        offset?: number;
        unreadOnly?: boolean;
    }): Promise<Notification[]>;
    /**
     * Get unread count for a user
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Mark notification as read
     */
    markAsRead(id: string): Promise<Notification | null>;
    /**
     * Mark all notifications as read for a user
     */
    markAllAsRead(userId: string): Promise<number>;
    /**
     * Delete notification
     */
    deleteNotification(id: string): Promise<boolean>;
    /**
     * Bulk delete notifications
     */
    bulkDeleteNotifications(notificationIds: string[]): Promise<number>;
    /**
     * Delete all notifications for a user
     */
    deleteAllForUser(userId: string): Promise<number>;
    /**
     * Delete old notifications (older than specified days)
     */
    deleteOldNotifications(daysOld: number): Promise<number>;
    /**
     * Create notification
     */
    createNotification(data: CreateNotificationDTO): Promise<Notification>;
    /**
     * Create bulk notifications
     */
    createBulkNotifications(notifications: CreateNotificationDTO[]): Promise<number>;
    /**
     * Get notification by ID
     */
    findById(id: string): Promise<Notification | null>;
    /**
     * Get notifications by type
     */
    findByType(userId: string, type: string, limit?: number): Promise<Notification[]>;
}
declare const _default: NotificationRepository;
export default _default;
//# sourceMappingURL=NotificationRepository.d.ts.map