"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const router = (0, express_1.Router)();
const authController = new AuthController_1.AuthController();
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validator_1.registerValidator, validator_1.validate, authController.register);
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validator_1.loginValidator, validator_1.validate, authController.login);
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', auth_1.authenticate, authController.me);
/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth_1.authenticate, validator_1.updateProfileValidator, validator_1.validate, authController.updateProfile);
/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get user sessions
 * @access  Private
 */
router.get('/sessions', auth_1.authenticate, authController.getSessions);
/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Disconnect specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', auth_1.authenticate, authController.disconnectSession);
/**
 * @route   DELETE /api/v1/auth/sessions
 * @desc    Disconnect all other sessions
 * @access  Private
 */
router.delete('/sessions', auth_1.authenticate, authController.disconnectAllSessions);
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
 * @access  Private
 */
router.post('/change-password', auth_1.authenticate, authController.changePassword);
/**
 * @route   GET /api/v1/auth/validate
 * @desc    Validate token
 * @access  Private
 */
router.get('/validate', auth_1.authenticate, authController.validateToken);
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth_1.authenticate, authController.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map