import express from 'express';
import UserService from '../services/UserService';
import WalletService from '../services/WalletService';
import { AuthRequest, logActivity } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { t } from '../locales';
import { prisma } from '../config/prisma';

export class UserController {
  /**
   * @swagger
   * /users/profile:
   *   get:
   *     summary: Get current user profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved
   */
  async getProfile(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await UserService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: t('user.not_found', req.language)
        });
        return;
      }

      const { password, ...userWithoutPassword } = user;

      await logActivity(
        userId,
        'VIEW',
        'PROFILE',
        userId,
        'Viewed own profile',
        null,
        req
      );

      res.json({
        success: true,
        message: t('user.profile_retrieved', req.language),
        data: userWithoutPassword
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/dashboard:
   *   get:
   *     summary: Get user dashboard data (wallet, rides, stats) in a single request
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dashboard data retrieved
   */
  async getDashboard(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // Récupérer toutes les données en parallèle en une seule requête groupée
      const [walletBalance, depositInfo, recentRides, rideStats, subscription] = await Promise.all([
        WalletService.getBalance(userId),
        WalletService.getDepositInfo(userId),
        // Récupérer les 5 dernières courses complétées
        prisma.ride.findMany({
          where: {
            userId,
            status: 'COMPLETED'
          },
          orderBy: { startTime: 'desc' },
          take: 5,
          select: {
            id: true,
            startTime: true,
            endTime: true,
            distance: true,
            cost: true,
            duration: true,
            bike: {
              select: {
                code: true,
                model: true
              }
            }
          }
        }),
        // Statistiques des courses
        Promise.all([
          prisma.ride.aggregate({
            where: { userId, status: 'COMPLETED' },
            _count: true,
            _sum: { cost: true, distance: true }
          }),
          prisma.ride.findFirst({
            where: { userId },
            orderBy: { startTime: 'desc' },
            select: { startTime: true }
          })
        ]),
        // Abonnement actif
        prisma.subscription.findFirst({
          where: {
            userId,
            isActive: true,
            endDate: { gte: new Date() }
          },
          include: {
            plan: {
              select: {
                name: true,
                type: true,
                hourlyRate: true,
                dailyRate: true,
                monthlyRate: true
              }
            }
          }
        }).catch(() => null)
      ]);

      const [aggregateStats, lastRide] = rideStats;

      res.json({
        success: true,
        message: t('user.dashboard_retrieved', req.language || 'fr'),
        data: {
          wallet: walletBalance,
          deposit: depositInfo,
          recentRides: recentRides || [],
          stats: {
            totalRides: aggregateStats._count || 0,
            totalSpent: aggregateStats._sum.cost || 0,
            totalDistance: aggregateStats._sum.distance || 0,
            lastRideDate: lastRide?.startTime || null
          },
          subscription: subscription || null
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/profile:
   *   put:
   *     summary: Update user profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               phone:
   *                 type: string
   *               email:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile updated
   */
  async updateProfile(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const oldUser = await UserService.getUserById(userId);
      
      const user = await UserService.updateProfile(userId, req.body);

      const { password, ...userWithoutPassword } = user;

      await logActivity(
        userId,
        'UPDATE',
        'PROFILE',
        userId,
        'Updated profile information',
        { 
          oldData: {
            firstName: oldUser?.firstName,
            lastName: oldUser?.lastName,
            phone: oldUser?.phone,
            email: oldUser?.email
          },
          newData: {
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email
          }
        },
        req
      );

      res.json({
        success: true,
        message: t('user.profile.updated', req.language),
        data: userWithoutPassword
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /users/password:
   *   put:
   *     summary: Update password
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password updated
   */
  async updatePassword(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      await UserService.updatePassword(userId, req.body);

      await logActivity(
        userId,
        'UPDATE',
        'PASSWORD',
        userId,
        'Changed password',
        null,
        req
      );

      res.json({
        success: true,
        message: t('auth.password_changed', req.language)
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /users/stats:
   *   get:
   *     summary: Get user statistics
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistics retrieved
   */
  async getStats(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const stats = await UserService.getUserStats(userId);

      await logActivity(
        userId,
        'VIEW',
        'USER_STATS',
        userId,
        'Viewed user statistics',
        { totalRides: stats.rides.total, totalSpent: stats.rides.totalCost },
        req
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/notifications:
   *   get:
   *     summary: Get user notifications
   *     tags: [Users]
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
   *         description: Notifications retrieved
   */
  async getNotifications(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await UserService.getUserNotifications(userId, page, limit);

      await logActivity(
        userId,
        'VIEW',
        'NOTIFICATIONS',
        '',
        `Viewed notifications (page ${page})`,
        { page, limit, unreadCount: result.notifications.length },
        req
      );

      res.json({
        success: true,
        message: t('notification.list_retrieved', req.language),
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/notifications/{id}/read:
   *   post:
   *     summary: Mark notification as read
   *     tags: [Users]
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
   *         description: Notification marked as read
   */
  async markNotificationAsRead(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await UserService.markNotificationAsRead(id, userId);

      await logActivity(
        userId,
        'UPDATE',
        'NOTIFICATION',
        id,
        'Marked notification as read',
        { notificationId: id },
        req
      );

      res.json({
        success: true,
        message: t('notification.marked_read', req.language)
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/notifications/read-all:
   *   post:
   *     summary: Mark all notifications as read
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All notifications marked as read
   */
  async markAllNotificationsAsRead(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      await UserService.markAllNotificationsAsRead(userId);

      await logActivity(
        userId,
        'UPDATE',
        'NOTIFICATIONS',
        '',
        'Marked all notifications as read',
        null,
        req
      );

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/notifications/unread-count:
   *   get:
   *     summary: Get unread notifications count
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Count retrieved
   */
  async getUnreadCount(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const count = await UserService.getUnreadNotificationsCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/account:
   *   delete:
   *     summary: Delete user account (archive)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Account deleted successfully
   */
  async deleteAccount(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;

      await UserService.deleteAccount(userId);

      await logActivity(
        userId,
        'DELETE',
        'ACCOUNT',
        userId,
        'User deleted their account',
        null,
        req
      );

      res.json({
        success: true,
        message: t('account.deleted', req.language)
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /users/preferences:
   *   get:
   *     summary: Get user notification preferences
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Preferences retrieved successfully
   */
  async getPreferences(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const preferences = await UserService.getPreferences(userId);

      await logActivity(
        userId,
        'VIEW',
        'PREFERENCES',
        userId,
        'Viewed notification preferences',
        null,
        req
      );

      res.json({
        success: true,
        message: t('preferences.retrieved', req.language),
        data: preferences
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/preferences:
   *   put:
   *     summary: Update user notification preferences
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               rideNotifications:
   *                 type: boolean
   *               promotionalNotifications:
   *                 type: boolean
   *               securityNotifications:
   *                 type: boolean
   *               systemNotifications:
   *                 type: boolean
   *               emailNotifications:
   *                 type: boolean
   *               pushNotifications:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Preferences updated successfully
   */
  async updatePreferences(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const preferences = await UserService.updatePreferences(userId, req.body);

      await logActivity(
        userId,
        'UPDATE',
        'PREFERENCES',
        userId,
        'Updated notification preferences',
        req.body,
        req
      );

      res.json({
        success: true,
        message: t('preferences.updated', req.language),
        data: preferences
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /users/push-token:
   *   post:
   *     summary: Register push notification token
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 type: string
   *               device:
   *                 type: string
   *               platform:
   *                 type: string
   *                 enum: [ios, android, web]
   *     responses:
   *       200:
   *         description: Push token registered successfully
   */
  async registerPushToken(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { token, device, platform } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Push token is required'
        });
        return;
      }

      const pushToken = await UserService.registerPushToken(userId, {
        token,
        device,
        platform
      });

      await logActivity(
        userId,
        'CREATE',
        'PUSH_TOKEN',
        pushToken.id,
        'Registered push notification token',
        { device, platform },
        req
      );

      res.json({
        success: true,
        message: t('push_token.registered', req.language),
        data: pushToken
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /users/push-token:
   *   delete:
   *     summary: Unregister push notification token
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *                 description: Specific token to unregister. If not provided, all tokens will be unregistered.
   *     responses:
   *       200:
   *         description: Push token unregistered successfully
   */
  async unregisterPushToken(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { token } = req.body;

      await UserService.unregisterPushToken(userId, token);

      await logActivity(
        userId,
        'DELETE',
        'PUSH_TOKEN',
        '',
        token ? 'Unregistered specific push token' : 'Unregistered all push tokens',
        { token },
        req
      );

      res.json({
        success: true,
        message: t('push_token.unregistered', req.language)
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users (Admin only)
   *     tags: [Users]
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
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Users retrieved
   */
  async getAllUsers(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const role = req.query.role as UserRole;

      const result = await UserService.getAllUsers(page, limit, role);

      // OPTIMISATION: Récupérer tous les wallets en une seule requête au lieu de N requêtes
      const userIds = result.users.map(user => user.id);
      const walletInfoMap = await WalletService.getBulkWalletInfo(userIds);

      // Enrichir les utilisateurs avec les données de wallet (déjà en mémoire)
      const enrichedUsers = result.users.map((user) => {
        const walletInfo = walletInfoMap.get(user.id);
        
        return {
          ...user,
          depositBalance: walletInfo?.currentDeposit || 0,
          accountBalance: walletInfo?.balance || 0
        };
      });

      await logActivity(
        req.user!.id,
        'VIEW',
        'USERS',
        '',
        `Viewed all users (page ${page}, role: ${role || 'all'})`,
        { page, limit, role, total: result.users.length },
        req
      );

      res.json({
        success: true,
        message: t('admin.users_retrieved', req.language),
        data: {
          ...result,
          users: enrichedUsers
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Create new user/employee (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               phone:
   *                 type: string
   *               roleId:
   *                 type: string
   *     responses:
   *       201:
   *         description: User created
   */
  async createUser(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const userData = req.body;
      
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        res.status(400).json({
          success: false,
          message: 'Email, password, first name and last name are required'
        });
        return;
      }

      const user = await UserService.createUser(userData);
      const { password, ...userWithoutPassword } = user;

      await logActivity(
        req.user!.id,
        'CREATE',
        'USER',
        user.id,
        `Created new user: ${user.firstName} ${user.lastName}`,
        { 
          createdUserId: user.id,
          userEmail: user.email,
          userRole: user.roleRelation?.name || user.role
        },
        req
      );

      res.status(201).json({
        success: true,
        message: t('user.created', req.language),
        data: {...userWithoutPassword, role: user.roleRelation?.name || user.role}
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update user (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               phone:
   *                 type: string
   *               email:
   *                 type: string
   *               roleId:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: User updated
   */
  async updateUser(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingUser = await UserService.getUserById(id);
      if (!existingUser) {
        res.status(404).json({
          success: false,
          message: t('user.not_found', req.language)
        });
        return;
      }

      const oldUserData = {
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        phone: existingUser.phone,
        email: existingUser.email,
        role: existingUser.role,
        roleId: existingUser.roleId,
        isActive: existingUser.isActive
      };

      const user = await UserService.updateUser(id, updateData);
      const { password, ...userWithoutPassword } = user;

      await logActivity(
        req.user!.id,
        'UPDATE',
        'USER',
        id,
        `Updated user: ${user.firstName} ${user.lastName}`,
        { 
          userId: id,
          oldData: oldUserData,
          newData: {
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
            role: user.role,
            roleId: user.roleId,
            isActive: user.isActive
          }
        },
        req
      );

      res.json({
        success: true,
        message: t('user.updated', req.language),
        data: userWithoutPassword
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /users/search:
   *   get:
   *     summary: Search users (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
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
   *         description: Users found
   */
  async searchUsers(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Search query required'
        });
        return;
      }

      const result = await UserService.searchUsers(query, page, limit);

      await logActivity(
        req.user!.id,
        'VIEW',
        'USERS_SEARCH',
        '',
        `Searched users: "${query}"`,
        { query, page, limit, results: result.users.length },
        req
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Get user by ID (Admin only)
   *     tags: [Users]
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
   *         description: User retrieved
   */
  async getUserById(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: t('user.not_found', req.language)
        });
        return;
      }

      const { password, ...userWithoutPassword } = user;
      const roleName = user.roleRelation?.name || user.role;

      await logActivity(
        req.user!.id,
        'VIEW',
        'USER',
        id,
        `Viewed user details: ${user.firstName} ${user.lastName}`,
        { viewedUserId: id, userEmail: user.email },
        req
      );

      res.json({
        success: true,
        data: {...userWithoutPassword, role: roleName}
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/{id}/role:
   *   put:
   *     summary: Update user role (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *               - roleId
   *             properties:
   *               roleId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Role updated
   */
  async updateUserRole(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { roleId } = req.body;

      if (!roleId) {
        res.status(400).json({
          success: false,
          message: 'Role ID is required'
        });
        return;
      }

      const oldUser = await UserService.getUserById(id);
      const user = await UserService.updateUserRole(id, roleId);
      const { password, ...userWithoutPassword } = user;

      const oldRoleName = oldUser?.roleRelation?.name || oldUser?.role;
      const newRoleName = user.roleRelation?.name || user.role;

      await logActivity(
        req.user!.id,
        'UPDATE',
        'USER_ROLE',
        id,
        `Changed user role from ${oldRoleName} to ${newRoleName}`,
        { 
          userId: id, 
          oldRole: oldRoleName, 
          newRole: newRoleName,
          userEmail: user.email
        },
        req
      );

      res.json({
        success: true,
        message: 'User role updated',
        data: {...userWithoutPassword, role: newRoleName}
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /users/{id}/status:
   *   put:
   *     summary: Toggle user status (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *               - isActive
   *             properties:
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Status updated
   */
  async toggleUserStatus(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const oldUser = await UserService.getUserById(id);
      const user = await UserService.toggleUserStatus(id, isActive);
      const { password, ...userWithoutPassword } = user;

      await logActivity(
        req.user!.id,
        'UPDATE',
        'USER_STATUS',
        id,
        `${isActive ? 'Activated' : 'Deactivated'} user account`,
        { 
          userId: id,
          oldStatus: oldUser?.isActive,
          newStatus: isActive,
          userEmail: user.email
        },
        req
      );

      res.json({
        success: true,
        message: isActive ? 'User activated' : 'User deactivated',
        data: userWithoutPassword
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Delete user (Admin only)
   *     tags: [Users]
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
   *         description: User deleted
   */
  async deleteUser(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const userToDelete = await UserService.getUserById(id);
      
      await UserService.deleteUser(id);

      await logActivity(
        req.user!.id,
        'DELETE',
        'USER',
        id,
        `Deleted user: ${userToDelete?.firstName} ${userToDelete?.lastName}`,
        { 
          deletedUserId: id,
          deletedUserEmail: userToDelete?.email,
          deletedUserRole: userToDelete?.role
        },
        req
      );

      res.json({
        success: true,
        message: t('user.deleted', req.language)
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/{id}/stats:
   *   get:
   *     summary: Get detailed user statistics (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: Detailed statistics retrieved successfully
   */
  async getUserStats(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const stats = await UserService.getUserDetailedStats(id);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * @swagger
   * /users/{id}/subscription/active:
   *   get:
   *     summary: Get user's active subscription (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: Active subscription retrieved successfully
   */
  async getUserActiveSubscription(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const subscription = await UserService.getUserActiveSubscription(id);

      await logActivity(
        req.user!.id,
        'VIEW',
        'USER_SUBSCRIPTION',
        id,
        `Viewed active subscription for user ID: ${id}`,
        { userId: id, subscriptionId: subscription ? subscription.planName : null },
        req
      );
      
      res.json({
        success: true,
        data: subscription
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * @swagger
   * /users/{id}/incidents:
   *   get:
   *     summary: Get user incidents (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: Incidents retrieved successfully
   */
  async getUserIncidents(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await UserService.getUserIncidents(id, page, limit);

      await logActivity(
        req.user!.id,
        'VIEW',
        'USER_INCIDENTS',
        id,
        `Viewed incidents for user ID: ${id}`,
        { userId: id, page, limit, totalIncidents: result.incidents.length },
        req
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * @swagger
   * /users/{id}/rides:
   *   get:
   *     summary: Get user rides (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: Rides retrieved successfully
   */
  async getUserRides(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await UserService.getUserRides(id, page, limit);

      await logActivity(
        req.user!.id,
        'VIEW',
        'USER_RIDES',
        id,
        `Viewed rides for user ID: ${id}`,
        { userId: id, page, limit, totalRides: result.rides.length },
        req
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * @swagger
   * /users/{id}/transactions:
   *   get:
   *     summary: Get user transactions (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of items per page
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Filter by transaction type
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by transaction status
   *     responses:
   *       200:
   *         description: Transactions retrieved successfully
   */
  async getUserTransactions(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const status = req.query.status as string;
      
      const result = await UserService.getUserTransactions(id, page, limit, { type, status });

      await logActivity(
        req.user!.id,
        'VIEW',
        'USER_TRANSACTIONS',
        id,
        `Viewed transactions for user ID: ${id}`,
        { userId: id, page, limit, type, status, totalTransactions: result.transactions.length },
        req
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * @swagger
   * /users/{id}/requests:
   *   get:
   *     summary: Get user requests (Admin only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Filter by request type
   *     responses:
   *       200:
   *         description: Requests retrieved successfully
   */
  async getUserRequests(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const type = req.query.type as string;
      
      const result = await UserService.getUserRequests(id, type);

      await logActivity(
        req.user!.id,
        'VIEW',
        'USER_REQUESTS',
        id,
        `Viewed requests for user ID: ${id}`,
        { userId: id, type, totalRequests: result.length },
        req
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Verify phone number manually (admin)
   */
  async verifyPhoneManually(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await UserService.verifyPhoneManually(id, req.user!.id);
      const { password, ...userWithoutPassword } = user;

      await logActivity(
        req.user!.id,
        'UPDATE',
        'USER_PHONE_VERIFICATION',
        id,
        'Phone number verified manually by admin',
        { 
          userId: id,
          userEmail: user.email,
          userPhone: user.phone
        },
        req
      );

      res.json({
        success: true,
        message: 'Phone number verified successfully',
        data: userWithoutPassword
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /users/{id}/deposit-exemption:
   *   post:
   *     summary: Grant deposit exemption to user (Admin only)
   *     tags: [Users, Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *               - days
   *             properties:
   *               days:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 365
   *     responses:
   *       200:
   *         description: Deposit exemption granted
   */
  async grantDepositExemption(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { days } = req.body;

      if (!days || days < 1 || days > 365) {
        res.status(400).json({
          success: false,
          message: 'Le nombre de jours doit être entre 1 et 365'
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
        return;
      }

      const exemptionUntil = new Date();
      exemptionUntil.setDate(exemptionUntil.getDate() + days);

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          depositExemptionUntil: exemptionUntil,
          depositExemptionGrantedBy: req.user?.id,
          depositExemptionGrantedAt: new Date()
        }
      });

      await logActivity(
        req.user?.id || null,
        'UPDATE',
        'USER_DEPOSIT_EXEMPTION',
        id,
        `Granted deposit exemption for ${days} days to user ${user.email}`,
        { userId: id, days, exemptionUntil },
        req
      );

      res.json({
        success: true,
        message: `Déblocage sans caution accordé pour ${days} jour(s)`,
        data: updatedUser
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'octroi du déblocage'
      });
    }
  }

  /**
   * @swagger
   * /users/{id}/deposit-exemption:
   *   delete:
   *     summary: Revoke deposit exemption from user (Admin only)
   *     tags: [Users, Admin]
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
   *         description: Deposit exemption revoked
   */
  async revokeDepositExemption(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          depositExemptionUntil: null,
          depositExemptionGrantedBy: null,
          depositExemptionGrantedAt: null
        }
      });

      await logActivity(
        req.user?.id || null,
        'UPDATE',
        'USER_DEPOSIT_EXEMPTION',
        id,
        `Revoked deposit exemption from user ${user.email}`,
        { userId: id },
        req
      );

      res.json({
        success: true,
        message: 'Déblocage révoqué avec succès',
        data: updatedUser
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la révocation du déblocage'
      });
    }
  }
}

export default new UserController();