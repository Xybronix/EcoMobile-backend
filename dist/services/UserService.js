"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = require("../config/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserService {
    /**
     * Get user by ID
     */
    async getUserById(id) {
        return await prisma_1.prisma.user.findUnique({
            where: { id },
            include: {
                wallet: true,
                roleRelation: true
            }
        });
    }
    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        return await prisma_1.prisma.user.findUnique({
            where: { email }
        });
    }
    /**
     * Get all users (admin)
     */
    async getAllUsers(page = 1, limit = 20, role) {
        const where = {};
        if (role) {
            where.role = role;
        }
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    wallet: true,
                    roleRelation: true,
                    _count: {
                        select: {
                            rides: true
                        }
                    }
                }
            }),
            prisma_1.prisma.user.count({ where })
        ]);
        return {
            users: users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    role: user.roleRelation?.name || user.role,
                    roleId: user.roleId
                };
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Create new user (admin)
     */
    async createUser(data) {
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            throw new Error('Email already in use');
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                roleId: data.roleId,
                isActive: data.isActive !== undefined ? data.isActive : true,
                wallet: {
                    create: {
                        balance: 0
                    }
                }
            },
            include: {
                wallet: true,
                roleRelation: true
            }
        });
        return user;
    }
    /**
     * Update user (admin)
     */
    async updateUser(userId, data) {
        if (data.email) {
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { email: data.email }
            });
            if (existingUser && existingUser.id !== userId) {
                throw new Error('Email already in use');
            }
        }
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                roleId: data.roleId,
                role: data.role,
                isActive: data.isActive
            },
            include: {
                wallet: true,
                roleRelation: true
            }
        });
        return user;
    }
    /**
     * Update user profile
     */
    async updateProfile(userId, data) {
        if (data.email) {
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { email: data.email }
            });
            if (existingUser && existingUser.id !== userId) {
                throw new Error('Email already in use');
            }
        }
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data
        });
        return user;
    }
    /**
     * Update user password
     */
    async updatePassword(userId, data) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const isValidPassword = await bcryptjs_1.default.compare(data.currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
    }
    /**
     * Update user role (admin only)
     */
    async updateUserRole(userId, roleId) {
        const roleExists = await prisma_1.prisma.role.findUnique({
            where: { id: roleId }
        });
        if (!roleExists) {
            throw new Error('Role not found');
        }
        return await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                roleId: roleId
            },
            include: {
                roleRelation: true,
                wallet: true,
                _count: {
                    select: {
                        rides: true
                    }
                }
            }
        });
    }
    /**
     * Activate/Deactivate user (admin only)
     */
    async toggleUserStatus(userId, isActive) {
        return await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { isActive, status: isActive ? 'active' : 'blocked' }
        });
    }
    /**
     * Delete user (admin only)
     */
    async deleteUser(userId) {
        await prisma_1.prisma.user.delete({
            where: { id: userId }
        });
    }
    /**
     * Get user statistics
     */
    async getUserStats(userId) {
        const [user, ridesStats, walletStats] = await Promise.all([
            prisma_1.prisma.user.findUnique({
                where: { id: userId },
                include: { wallet: true }
            }),
            prisma_1.prisma.ride.aggregate({
                where: { userId, status: 'COMPLETED' },
                _count: true,
                _sum: {
                    distance: true,
                    cost: true,
                    duration: true
                }
            }),
            prisma_1.prisma.transaction.aggregate({
                where: {
                    wallet: { userId },
                    status: 'COMPLETED'
                },
                _sum: { amount: true }
            })
        ]);
        return {
            user: user ? { ...user, password: undefined } : null,
            rides: {
                total: ridesStats._count,
                totalDistance: ridesStats._sum.distance || 0,
                totalCost: ridesStats._sum.cost || 0,
                totalDuration: ridesStats._sum.duration || 0
            },
            wallet: {
                balance: user?.wallet?.balance || 0,
                totalTransacted: walletStats._sum.amount || 0
            }
        };
    }
    /**
     * Search users (admin)
     */
    async searchUsers(query, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {
            OR: [
                { email: { contains: query, mode: 'insensitive' } },
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } }
            ]
        };
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    wallet: true,
                    roleRelation: true
                }
            }),
            prisma_1.prisma.user.count({ where })
        ]);
        return {
            users: users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return {
                    ...userWithoutPassword,
                    role: user.roleRelation?.name || user.role,
                    roleId: user.roleId // Inclure l'ID du rôle
                };
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Get user notifications
     */
    async getUserNotifications(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            prisma_1.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.prisma.notification.count({ where: { userId } })
        ]);
        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId, userId) {
        await prisma_1.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId
            },
            data: { isRead: true }
        });
    }
    /**
     * Mark all notifications as read
     */
    async markAllNotificationsAsRead(userId) {
        await prisma_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
    }
    /**
     * Get unread notifications count
     */
    async getUnreadNotificationsCount(userId) {
        return await prisma_1.prisma.notification.count({
            where: { userId, isRead: false }
        });
    }
}
exports.UserService = UserService;
exports.default = new UserService();
//# sourceMappingURL=UserService.js.map