"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseRepository_1 = require("./BaseRepository");
const prisma_1 = require("../config/prisma");
class NotificationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('notification');
    }
    static getInstance() {
        if (!NotificationRepository.instance) {
            NotificationRepository.instance = new NotificationRepository();
        }
        return NotificationRepository.instance;
    }
    /**
     * Get all notifications for a user
     */
    async findByUserId(userId, options) {
        const { limit = 50, offset = 0, unreadOnly = false } = options || {};
        const notifications = await prisma_1.prisma.notification.findMany({
            where: {
                userId,
                ...(unreadOnly && { isRead: false }),
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
        });
        return notifications;
    }
    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId) {
        return await prisma_1.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }
    /**
     * Mark notification as read
     */
    async markAsRead(id) {
        const notification = await prisma_1.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
        return notification;
    }
    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        const result = await prisma_1.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        return result.count;
    }
    /**
     * Delete notification
     */
    async deleteNotification(id) {
        try {
            await prisma_1.prisma.notification.delete({
                where: { id },
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Bulk delete notifications
     */
    async bulkDeleteNotifications(notificationIds) {
        const result = await prisma_1.prisma.notification.deleteMany({
            where: {
                id: {
                    in: notificationIds,
                },
            },
        });
        return result.count;
    }
    /**
     * Delete all notifications for a user
     */
    async deleteAllForUser(userId) {
        const result = await prisma_1.prisma.notification.deleteMany({
            where: { userId },
        });
        return result.count;
    }
    /**
     * Delete old notifications (older than specified days)
     */
    async deleteOldNotifications(daysOld) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const result = await prisma_1.prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
                isRead: true,
            },
        });
        return result.count;
    }
    /**
     * Create notification
     */
    async createNotification(data) {
        const notification = await prisma_1.prisma.notification.create({
            data,
        });
        return notification;
    }
    /**
     * Create bulk notifications
     */
    async createBulkNotifications(notifications) {
        const result = await prisma_1.prisma.notification.createMany({
            data: notifications,
        });
        return result.count;
    }
    /**
     * Get notification by ID
     */
    async findById(id) {
        const notification = await prisma_1.prisma.notification.findUnique({
            where: { id },
        });
        return notification;
    }
    /**
     * Get notifications by type
     */
    async findByType(userId, type, limit = 20) {
        const notifications = await prisma_1.prisma.notification.findMany({
            where: {
                userId,
                type,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
        return notifications;
    }
}
exports.default = NotificationRepository.getInstance();
//# sourceMappingURL=NotificationRepository%20copy.js.map