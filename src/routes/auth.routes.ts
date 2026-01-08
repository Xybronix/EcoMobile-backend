import express from 'express';
import { AuthController } from '../controllers/AuthController';
<<<<<<< HEAD
import { authenticateWithPendingVerification } from '../middleware/auth';
=======
import { authenticate } from '../middleware/auth';
>>>>>>> origin/main
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
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.get('/me', authenticateWithPendingVerification, authController.me);
=======
 * @access  Private
 */
router.get('/me', authenticate, authController.me);
>>>>>>> origin/main

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.put('/profile', authenticateWithPendingVerification, updateProfileValidator, validate, authController.updateProfile);
=======
 * @access  Private
 */
router.put('/profile', authenticate, updateProfileValidator, validate, authController.updateProfile);
>>>>>>> origin/main

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get user sessions
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.get('/sessions', authenticateWithPendingVerification, authController.getSessions);
=======
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getSessions);
>>>>>>> origin/main

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Disconnect specific session
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.delete('/sessions/:sessionId', authenticateWithPendingVerification, authController.disconnectSession);
=======
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, authController.disconnectSession);
>>>>>>> origin/main

/**
 * @route   DELETE /api/v1/auth/sessions
 * @desc    Disconnect all other sessions
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.delete('/sessions', authenticateWithPendingVerification, authController.disconnectAllSessions);
=======
 * @access  Private
 */
router.delete('/sessions', authenticate, authController.disconnectAllSessions);
>>>>>>> origin/main

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
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.post('/change-password', authenticateWithPendingVerification, authController.changePassword);
=======
 * @access  Private
 */
router.post('/change-password', authenticate, authController.changePassword);
>>>>>>> origin/main

/**
 * @route   GET /api/v1/auth/validate
 * @desc    Validate token
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.get('/validate', authenticateWithPendingVerification, authController.validateToken);
=======
 * @access  Private
 */
router.get('/validate', authenticate, authController.validateToken);
>>>>>>> origin/main

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.post('/logout', authenticateWithPendingVerification, authController.logout);
=======
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);
>>>>>>> origin/main

/**
 * @route   POST /api/v1/auth/verify-phone/initiate
 * @desc    Initiate phone verification
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.post('/verify-phone/initiate', authenticateWithPendingVerification, authController.initiatePhoneVerification);
=======
 * @access  Private
 */
router.post('/verify-phone/initiate', authenticate, authController.initiatePhoneVerification);
>>>>>>> origin/main

/**
 * @route   POST /api/v1/auth/verify-phone/verify
 * @desc    Verify phone code
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.post('/verify-phone/verify', authenticateWithPendingVerification, authController.verifyPhoneCode);
=======
 * @access  Private
 */
router.post('/verify-phone/verify', authenticate, authController.verifyPhoneCode);
>>>>>>> origin/main

/**
 * @route   POST /api/v1/auth/verify-phone/resend
 * @desc    Resend phone verification code
<<<<<<< HEAD
 * @access  Private (including pending_verification)
 */
router.post('/verify-phone/resend', authenticateWithPendingVerification, authController.resendPhoneVerification);
=======
 * @access  Private
 */
router.post('/verify-phone/resend', authenticate, authController.resendPhoneVerification);
>>>>>>> origin/main

export default router;