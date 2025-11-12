"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const UserService_1 = __importDefault(require("../services/UserService"));
const auth_1 = require("../middleware/auth");
const locales_1 = require("../locales");
class UserController {
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
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await UserService_1.default.getUserById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: (0, locales_1.t)('user.not_found', req.language)
                });
                return;
            }
            const { password, ...userWithoutPassword } = user;
            await (0, auth_1.logActivity)(userId, 'VIEW', 'PROFILE', userId, 'Viewed own profile', null, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('user.profile_retrieved', req.language),
                data: userWithoutPassword
            });
        }
        catch (error) {
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
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const oldUser = await UserService_1.default.getUserById(userId);
            const user = await UserService_1.default.updateProfile(userId, req.body);
            const { password, ...userWithoutPassword } = user;
            await (0, auth_1.logActivity)(userId, 'UPDATE', 'PROFILE', userId, 'Updated profile information', {
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
            }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('user.profile.updated', req.language),
                data: userWithoutPassword
            });
        }
        catch (error) {
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
    async updatePassword(req, res) {
        try {
            const userId = req.user.id;
            await UserService_1.default.updatePassword(userId, req.body);
            await (0, auth_1.logActivity)(userId, 'UPDATE', 'PASSWORD', userId, 'Changed password', null, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('auth.password_changed', req.language)
            });
        }
        catch (error) {
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
    async getStats(req, res) {
        try {
            const userId = req.user.id;
            const stats = await UserService_1.default.getUserStats(userId);
            await (0, auth_1.logActivity)(userId, 'VIEW', 'USER_STATS', userId, 'Viewed user statistics', { totalRides: stats.rides.total, totalSpent: stats.rides.totalCost }, req);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
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
    async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await UserService_1.default.getUserNotifications(userId, page, limit);
            await (0, auth_1.logActivity)(userId, 'VIEW', 'NOTIFICATIONS', '', `Viewed notifications (page ${page})`, { page, limit, unreadCount: result.notifications.length }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('notification.list_retrieved', req.language),
                data: result
            });
        }
        catch (error) {
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
    async markNotificationAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await UserService_1.default.markNotificationAsRead(id, userId);
            await (0, auth_1.logActivity)(userId, 'UPDATE', 'NOTIFICATION', id, 'Marked notification as read', { notificationId: id }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('notification.marked_read', req.language)
            });
        }
        catch (error) {
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
    async markAllNotificationsAsRead(req, res) {
        try {
            const userId = req.user.id;
            await UserService_1.default.markAllNotificationsAsRead(userId);
            await (0, auth_1.logActivity)(userId, 'UPDATE', 'NOTIFICATIONS', '', 'Marked all notifications as read', null, req);
            res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        }
        catch (error) {
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
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const count = await UserService_1.default.getUnreadNotificationsCount(userId);
            res.json({
                success: true,
                data: { unreadCount: count }
            });
        }
        catch (error) {
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
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const role = req.query.role;
            const result = await UserService_1.default.getAllUsers(page, limit, role);
            await (0, auth_1.logActivity)(req.user.id, 'VIEW', 'USERS', '', `Viewed all users (page ${page}, role: ${role || 'all'})`, { page, limit, role, total: result.users.length }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('admin.users_retrieved', req.language),
                data: result
            });
        }
        catch (error) {
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
    async createUser(req, res) {
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
            const user = await UserService_1.default.createUser(userData);
            const { password, ...userWithoutPassword } = user;
            await (0, auth_1.logActivity)(req.user.id, 'CREATE', 'USER', user.id, `Created new user: ${user.firstName} ${user.lastName}`, {
                createdUserId: user.id,
                userEmail: user.email,
                userRole: user.roleRelation?.name || user.role
            }, req);
            res.status(201).json({
                success: true,
                message: (0, locales_1.t)('user.created', req.language),
                data: { ...userWithoutPassword, role: user.roleRelation?.name || user.role }
            });
        }
        catch (error) {
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
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            // Check if user exists
            const existingUser = await UserService_1.default.getUserById(id);
            if (!existingUser) {
                res.status(404).json({
                    success: false,
                    message: (0, locales_1.t)('user.not_found', req.language)
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
            const user = await UserService_1.default.updateUser(id, updateData);
            const { password, ...userWithoutPassword } = user;
            await (0, auth_1.logActivity)(req.user.id, 'UPDATE', 'USER', id, `Updated user: ${user.firstName} ${user.lastName}`, {
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
            }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('user.updated', req.language),
                data: userWithoutPassword
            });
        }
        catch (error) {
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
    async searchUsers(req, res) {
        try {
            const query = req.query.q;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            if (!query) {
                res.status(400).json({
                    success: false,
                    message: 'Search query required'
                });
                return;
            }
            const result = await UserService_1.default.searchUsers(query, page, limit);
            await (0, auth_1.logActivity)(req.user.id, 'VIEW', 'USERS_SEARCH', '', `Searched users: "${query}"`, { query, page, limit, results: result.users.length }, req);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
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
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await UserService_1.default.getUserById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: (0, locales_1.t)('user.not_found', req.language)
                });
                return;
            }
            const { password, ...userWithoutPassword } = user;
            const roleName = user.roleRelation?.name || user.role;
            await (0, auth_1.logActivity)(req.user.id, 'VIEW', 'USER', id, `Viewed user details: ${user.firstName} ${user.lastName}`, { viewedUserId: id, userEmail: user.email }, req);
            res.json({
                success: true,
                data: { ...userWithoutPassword, role: roleName }
            });
        }
        catch (error) {
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
    async updateUserRole(req, res) {
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
            const oldUser = await UserService_1.default.getUserById(id);
            const user = await UserService_1.default.updateUserRole(id, roleId);
            const { password, ...userWithoutPassword } = user;
            const oldRoleName = oldUser?.roleRelation?.name || oldUser?.role;
            const newRoleName = user.roleRelation?.name || user.role;
            await (0, auth_1.logActivity)(req.user.id, 'UPDATE', 'USER_ROLE', id, `Changed user role from ${oldRoleName} to ${newRoleName}`, {
                userId: id,
                oldRole: oldRoleName,
                newRole: newRoleName,
                userEmail: user.email
            }, req);
            res.json({
                success: true,
                message: 'User role updated',
                data: { ...userWithoutPassword, role: newRoleName }
            });
        }
        catch (error) {
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
    async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            const oldUser = await UserService_1.default.getUserById(id);
            const user = await UserService_1.default.toggleUserStatus(id, isActive);
            const { password, ...userWithoutPassword } = user;
            await (0, auth_1.logActivity)(req.user.id, 'UPDATE', 'USER_STATUS', id, `${isActive ? 'Activated' : 'Deactivated'} user account`, {
                userId: id,
                oldStatus: oldUser?.isActive,
                newStatus: isActive,
                userEmail: user.email
            }, req);
            res.json({
                success: true,
                message: isActive ? 'User activated' : 'User deactivated',
                data: userWithoutPassword
            });
        }
        catch (error) {
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
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const userToDelete = await UserService_1.default.getUserById(id);
            await UserService_1.default.deleteUser(id);
            await (0, auth_1.logActivity)(req.user.id, 'DELETE', 'USER', id, `Deleted user: ${userToDelete?.firstName} ${userToDelete?.lastName}`, {
                deletedUserId: id,
                deletedUserEmail: userToDelete?.email,
                deletedUserRole: userToDelete?.role
            }, req);
            res.json({
                success: true,
                message: (0, locales_1.t)('user.deleted', req.language)
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.UserController = UserController;
exports.default = new UserController();
//# sourceMappingURL=UserController.js.map