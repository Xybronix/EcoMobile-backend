import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateWithPendingVerification } from '../middleware/auth';
import { loginValidator, registerValidator, updateProfileValidator, validate } from '../middleware/validator';

const router = express.Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidator, validate, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidator, validate, authController.login);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify-email', validate, authController.verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', validate, authController.resendVerification);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private (including pending_verification)
 */
router.get('/me', authenticateWithPendingVerification, authController.me);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private (including pending_verification)
 */
router.put('/profile', authenticateWithPendingVerification, updateProfileValidator, validate, authController.updateProfile);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get user sessions
 * @access  Private (including pending_verification)
 */
router.get('/sessions', authenticateWithPendingVerification, authController.getSessions);

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Disconnect specific session
 * @access  Private (including pending_verification)
 */
router.delete('/sessions/:sessionId', authenticateWithPendingVerification, authController.disconnectSession);

/**
 * @route   DELETE /api/v1/auth/sessions
 * @desc    Disconnect all other sessions
 * @access  Private (including pending_verification)
 */
router.delete('/sessions', authenticateWithPendingVerification, authController.disconnectAllSessions);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private (including pending_verification)
 */
router.post('/change-password', authenticateWithPendingVerification, authController.changePassword);

/**
 * @route   GET /api/v1/auth/validate
 * @desc    Validate token
 * @access  Private (including pending_verification)
 */
router.get('/validate', authenticateWithPendingVerification, authController.validateToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private (including pending_verification)
 */
router.post('/logout', authenticateWithPendingVerification, authController.logout);

/**
 * @route   POST /api/v1/auth/verify-phone/initiate
 * @desc    Initiate phone verification
 * @access  Private (including pending_verification)
 */
router.post('/verify-phone/initiate', authenticateWithPendingVerification, authController.initiatePhoneVerification);

/**
 * @route   POST /api/v1/auth/verify-phone/verify
 * @desc    Verify phone code
 * @access  Private (including pending_verification)
 */
router.post('/verify-phone/verify', authenticateWithPendingVerification, authController.verifyPhoneCode);

/**
 * @route   POST /api/v1/auth/verify-phone/resend
 * @desc    Resend phone verification code
 * @access  Private (including pending_verification)
 */
router.post('/verify-phone/resend', authenticateWithPendingVerification, authController.resendPhoneVerification);

export default router;