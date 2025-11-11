import { Response } from 'express';
import { AuthRequest, logActivity } from '../middleware/auth';
import { AuthService } from '../services';
import { asyncHandler } from '../middleware/errorHandler';
import { t } from '../locales';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

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
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const result = await this.authService.register(req.body, language);

    await logActivity(
      result.user.id,
      'CREATE',
      'USER',
      result.user.id,
      'User registered successfully',
      { email: result.user.email, firstName: result.user.firstName },
      req
    );

    res.status(201).json({
      success: true,
      message: t('auth.register.success', language),
      data: result
    });
  });

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
  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const result = await this.authService.login(req.body, language, req);

    await logActivity(
      result.user.id,
      'LOGIN',
      'AUTH',
      result.user.id,
      'User logged in successfully',
      { email: result.user.email },
      req
    );

    res.status(200).json({
      success: true,
      message: t('auth.login.success', language),
      data: result
    });
  });

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
  me = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const userId = req.user!.id;
    
    const user = await this.authService.getUserById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: t('user.not_found', language)
      });
      return;
    }

    const userResponse = {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status as 'active' | 'blocked' | 'pending',
      role: user.role,
      roleId: user.roleId,
      permissions: req.user!.permissions,
      isActive: user.isActive,
      avatar: user.avatar || null,
      phone: user.phone || null,
      address: user.address || null
    };

    await logActivity(
      req.user?.id || null,
      'VIEW',
      'PROFILE',
      req.user?.id || '',
      'User viewed their profile',
      null,
      req
    );

    res.status(200).json({
      success: true,
      data: userResponse
    });
  });

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
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const userId = req.user!.id;
    
    const updatedUser = await this.authService.updateProfile(userId, req.body, language);

    await logActivity(
      userId,
      'UPDATE',
      'PROFILE',
      userId,
      'User updated their profile',
      req.body,
      req
    );

    const userResponse = {
      id: updatedUser.id,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`,
      email: updatedUser.email,
      status: updatedUser.status as 'active' | 'blocked' | 'pending',
      role: updatedUser.role,
      roleId: updatedUser.roleId,
      permissions: req.user!.permissions,
      isActive: updatedUser.isActive,
      avatar: updatedUser.avatar || null,
      phone: updatedUser.phone || null,
      address: updatedUser.address || null
    };

    res.status(200).json({
      success: true,
      message: t('profile.update.success', language),
      data: userResponse
    });
  });

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
  getSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const userId = req.user!.id;

    const sessions = await this.authService.getSessions(userId, language);

    await logActivity(
      userId,
      'VIEW',
      'SESSIONS',
      userId,
      'User viewed their sessions',
      null,
      req
    );

    res.status(200).json({
      success: true,
      data: sessions
    });
  });

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
  disconnectSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const userId = req.user!.id;
    const { sessionId } = req.params;

    await this.authService.disconnectSession(userId, sessionId, language);

    await logActivity(
      userId,
      'DELETE',
      'SESSION',
      sessionId,
      'User disconnected a session',
      { sessionId },
      req
    );

    res.status(200).json({
      success: true,
      message: t('session.disconnect.success', language)
    });
  });

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
  disconnectAllSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const userId = req.user!.id;

    await this.authService.disconnectAllSessions(userId, language);

    await logActivity(
      userId,
      'DELETE',
      'SESSIONS',
      userId,
      'User disconnected all other sessions',
      null,
      req
    );

    res.status(200).json({
      success: true,
      message: t('session.disconnect_all.success', language)
    });
  });

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
  forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const { email } = req.body;

    const message = await this.authService.forgotPassword(email, language);

    await logActivity(
      null,
      'REQUEST',
      'PASSWORD_RESET',
      '',
      `Password reset requested for email: ${email}`,
      { email },
      req
    );

    res.status(200).json({
      success: true,
      message
    });
  });

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
  resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const { email, newPassword } = req.body;

    const user = await this.authService.resetPassword(email, newPassword, language);

    await logActivity(
      user.id,
      'UPDATE',
      'PASSWORD',
      user.id,
      'Password reset successfully',
      { email },
      req
    );

    res.status(200).json({
      success: true,
      message: t('auth.password.reset.success', language)
    });
  });

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
  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    await this.authService.changePassword(userId, currentPassword, newPassword, language);

    await logActivity(
      userId,
      'UPDATE',
      'PASSWORD',
      userId,
      'Password changed successfully',
      null,
      req
    );

    res.status(200).json({
      success: true,
      message: t('auth.password.change.success', language)
    });
  });

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
  validateToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user,
        valid: true
      }
    });
  });

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
  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const language = req.language || 'fr';
    const userId = req.user?.id;

    if (userId) {
      await this.authService.logout(userId, language);
      await logActivity(
        userId,
        'LOGOUT',
        'AUTH',
        userId,
        'User logged out successfully',
        null,
        req
      );
    }

    res.status(200).json({
      success: true,
      message: t('auth.logout.success', language)
    });
  });
}