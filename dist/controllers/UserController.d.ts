import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class UserController {
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
    getProfile(req: AuthRequest, res: Response): Promise<void>;
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
    updateProfile(req: AuthRequest, res: Response): Promise<void>;
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
    updatePassword(req: AuthRequest, res: Response): Promise<void>;
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
    getStats(req: AuthRequest, res: Response): Promise<void>;
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
    getNotifications(req: AuthRequest, res: Response): Promise<void>;
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
    markNotificationAsRead(req: AuthRequest, res: Response): Promise<void>;
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
    markAllNotificationsAsRead(req: AuthRequest, res: Response): Promise<void>;
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
    getUnreadCount(req: AuthRequest, res: Response): Promise<void>;
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
    getAllUsers(req: AuthRequest, res: Response): Promise<void>;
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
    createUser(req: AuthRequest, res: Response): Promise<void>;
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
    updateUser(req: AuthRequest, res: Response): Promise<void>;
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
    searchUsers(req: AuthRequest, res: Response): Promise<void>;
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
    getUserById(req: AuthRequest, res: Response): Promise<void>;
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
    updateUserRole(req: AuthRequest, res: Response): Promise<void>;
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
    toggleUserStatus(req: AuthRequest, res: Response): Promise<void>;
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
    deleteUser(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=UserController.d.ts.map