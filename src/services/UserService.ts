import { prisma } from '../config/prisma';
import { User, UserRole, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    wallet: true;
    roleRelation: true;
  }
}>;

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  roleId?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  roleId?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserWithRelations | null> {
    return await prisma.user.findUnique({
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
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Get all users (admin)
   */
  async getAllUsers(page: number = 1, limit: number = 20, role?: UserRole) {
    const where: any = {};
    
    if (role) {
      where.role = role;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where })
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
  async createUser(data: CreateUserDto): Promise<UserWithRelations> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
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
  async updateUser(userId: string, data: UpdateUserDto): Promise<UserWithRelations> {
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already in use');
      }
    }

    const user = await prisma.user.update({
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
  async updateProfile(userId: string, data: UpdateUserDto): Promise<User> {
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already in use');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    return user;
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, data: UpdatePasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
    
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, roleId: string): Promise<UserWithRelations> {
    const roleExists = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!roleExists) {
      throw new Error('Role not found');
    }

    return await prisma.user.update({
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
  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { isActive, status: isActive ? 'active' : 'blocked' }
    });
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId }
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const [user, ridesStats, walletStats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true }
      }),
      prisma.ride.aggregate({
        where: { userId, status: 'COMPLETED' },
        _count: true,
        _sum: {
          distance: true,
          cost: true,
          duration: true
        }
      }),
      prisma.transaction.aggregate({
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
  async searchUsers(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { email: { contains: query, mode: 'insensitive' as const } },
        { firstName: { contains: query, mode: 'insensitive' as const } },
        { lastName: { contains: query, mode: 'insensitive' as const } },
        { phone: { contains: query } }
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          roleRelation: true
        }
      }),
      prisma.user.count({ where })
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
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where: { userId } })
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
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
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
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  /**
   * Get unread notifications count
   */
  async getUnreadNotificationsCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  /**
   * Archive user account (soft delete)
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Archive the account by changing email and status
    const archivedEmail = `deleted_${Date.now()}_${user.email}`;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: archivedEmail,
        isActive: false,
        status: 'deleted',
        // Keep other data for historical purposes
      }
    });

    // Deactivate all sessions
    await prisma.session.updateMany({
      where: { userId },
      data: { isActive: false }
    });

    // Deactivate push tokens
    await prisma.pushToken.updateMany({
      where: { userId },
      data: { isActive: false }
    });
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string) {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId }
      });
    }

    return preferences;
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId: string, data: Partial<{
    rideNotifications: boolean;
    promotionalNotifications: boolean;
    securityNotifications: boolean;
    systemNotifications: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  }>) {
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });

    return preferences;
  }

  /**
   * Register push token
   */
  async registerPushToken(userId: string, tokenData: {
    token: string;
    device?: string;
    platform?: string;
  }) {
    // Deactivate existing tokens for this device/user if any
    await prisma.pushToken.updateMany({
      where: {
        userId,
        token: tokenData.token
      },
      data: { isActive: false }
    });

    // Create new token
    const pushToken = await prisma.pushToken.create({
      data: {
        userId,
        token: tokenData.token,
        device: tokenData.device,
        platform: tokenData.platform,
        isActive: true
      }
    });

    return pushToken;
  }

  /**
   * Unregister push token
   */
  async unregisterPushToken(userId: string, token?: string) {
    const whereCondition: any = { userId, isActive: true };
    
    if (token) {
      whereCondition.token = token;
    }

    await prisma.pushToken.updateMany({
      where: whereCondition,
      data: { isActive: false }
    });
  }

  /**
   * Get active push tokens for user
   */
  async getUserPushTokens(userId: string) {
    return await prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true
      }
    });
  }
}

export default new UserService();