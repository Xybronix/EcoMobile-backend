import { Response } from 'express';
export declare class AuthController {
    private authService;
    constructor();
    /**
     * @swagger
     * /auth/register:
     *   post:
     *     summary: Register a new user
     *     tags: [Auth]
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
     *                 format: email
     *               password:
     *                 type: string
     *                 format: password
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               phone:
     *                 type: string
     *     responses:
     *       201:
     *         description: User successfully registered
     */
    register: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Login user
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *                 format: password
     *     responses:
     *       200:
     *         description: User successfully logged in
     */
    login: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/me:
     *   get:
     *     summary: Get current user profile
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User profile retrieved successfully
     */
    me: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/profile:
     *   put:
     *     summary: Update user profile
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Profile updated successfully
     */
    updateProfile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/sessions:
     *   get:
     *     summary: Get user sessions
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Sessions retrieved successfully
     */
    getSessions: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/sessions/{sessionId}:
     *   delete:
     *     summary: Disconnect specific session
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Session disconnected successfully
     */
    disconnectSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/sessions:
     *   delete:
     *     summary: Disconnect all other sessions
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: All other sessions disconnected successfully
     */
    disconnectAllSessions: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/forgot-password:
     *   post:
     *     summary: Request password reset
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *     responses:
     *       200:
     *         description: Password reset email sent
     */
    forgotPassword: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/reset-password:
     *   post:
     *     summary: Reset password with token
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - newPassword
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               newPassword:
     *                 type: string
     *                 format: password
     *     responses:
     *       200:
     *         description: Password successfully reset
     */
    resetPassword: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/change-password:
     *   post:
     *     summary: Change password (authenticated user)
     *     tags: [Auth]
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
     *                 format: password
     *               newPassword:
     *                 type: string
     *                 format: password
     *     responses:
     *       200:
     *         description: Password successfully changed
     */
    changePassword: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/validate:
     *   get:
     *     summary: Validate token
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Token is valid
     */
    validateToken: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     summary: Logout user
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User successfully logged out
     */
    logout: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=AuthController.d.ts.map