import express from 'express';
import UserService from '../services/UserService';
import { AuthRequest, logActivity } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { t } from '../locales';

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
        message: error.message
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
        message: error.message
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
   *     tags: [Users, Notifications]
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
   *     tags: [Users, Notifications]
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
   *     tags: [Users, Notifications]
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
   *     tags: [Users, Notifications]
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

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users (Admin only)
   *     tags: [Users, Admin]
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
   * /users:
   *   post:
   *     summary: Create new user/employee (Admin only)
   *     tags: [Users, Admin]
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
      
      // Validate required fields
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
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update user (Admin only)
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

      // Check if user exists
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
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/search:
   *   get:
   *     summary: Search users (Admin only)
   *     tags: [Users, Admin]
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
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/{id}/status:
   *   put:
   *     summary: Toggle user status (Admin only)
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
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Delete user (Admin only)
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
}

export default new UserController();