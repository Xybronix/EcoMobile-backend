"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminController_1 = __importDefault(require("../controllers/AdminController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All admin routes require authentication
router.use(auth_1.authenticate);
/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administration endpoints
 */
/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private/Admin
 */
router.get('/dashboard/stats', (0, auth_1.requirePermission)('admin', 'read'), AdminController_1.default.getDashboardStats);
/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get dashboard data
 * @access  Private/Admin
 */
router.get('/dashboard', (0, auth_1.requirePermission)('admin', 'read'), AdminController_1.default.getDashboardStats);
/**
 * @route   GET /api/v1/admin/settings
 * @desc    Get application settings
 * @access  Private/Admin
 */
router.get('/settings', (0, auth_1.requirePermission)('settings', 'read'), AdminController_1.default.getSettings);
/**
 * @route   PUT /api/v1/admin/settings
 * @desc    Update application settings
 * @access  Private/Admin
 */
router.put('/settings', (0, auth_1.requirePermission)('settings', 'update'), AdminController_1.default.updateSettings);
/**
 * @route   GET /api/v1/admin/pricing
 * @desc    Get pricing configuration
 * @access  Private/Admin
 */
router.get('/pricing', (0, auth_1.requirePermission)('pricing', 'read'), AdminController_1.default.getPricing);
/**
 * @route   PUT /api/v1/admin/pricing
 * @desc    Update pricing configuration
 * @access  Private/Admin
 */
router.put('/pricing', (0, auth_1.requirePermission)('pricing', 'update'), AdminController_1.default.updatePricing);
/**
 * @route   GET /api/v1/admin/promotions
 * @desc    Get all promotions (Admin only)
 * @access  Private/Admin
 */
router.get('/promotions', (0, auth_1.requirePermission)('promotions', 'read'), AdminController_1.default.getPromotions);
/**
 * @route   POST /api/v1/admin/promotions
 * @desc    Create new promotion (Admin only)
 * @access  Private/Admin
 */
router.post('/promotions', (0, auth_1.requirePermission)('promotions', 'create'), AdminController_1.default.createPromotion);
/**
 * @route   PUT /api/v1/admin/promotions/:id
 * @desc    Update promotion (Admin only)
 * @access  Private/Admin
 */
router.put('/promotions/:id', (0, auth_1.requirePermission)('promotions', 'update'), AdminController_1.default.updatePromotion);
/**
 * @route   PUT /api/v1/admin/promotions/:id/status
 * @desc    Toggle promotion status (Admin only)
 * @access  Private/Admin
 */
router.put('/promotions/:id/status', (0, auth_1.requirePermission)('promotions', 'update'), AdminController_1.default.togglePromotionStatus);
/**
 * @route   DELETE /api/v1/admin/plans/:id
 * @desc    Delete pricing plan (Admin only)
 * @access  Private/Admin
 */
router.delete('/plans/:id', (0, auth_1.requirePermission)('pricing', 'delete'), AdminController_1.default.deletePlan);
/**
 * @route   DELETE /api/v1/admin/rules/:id
 * @desc    Delete pricing rule (Admin only)
 * @access  Private/Admin
 */
router.delete('/rules/:id', (0, auth_1.requirePermission)('pricing', 'delete'), AdminController_1.default.deleteRule);
/**
 * @route   DELETE /api/v1/admin/promotions/:id
 * @desc    Delete promotion (Admin only)
 * @access  Private/Admin
 */
router.delete('/promotions/:id', (0, auth_1.requirePermission)('promotions', 'delete'), AdminController_1.default.deletePromotion);
/**
 * @route   GET /api/v1/admin/financial/stats
 * @desc    Get financial statistics
 * @access  Private/Admin
 */
router.get('/financial/stats', (0, auth_1.requirePermission)('financial', 'read'), AdminController_1.default.getFinancialStats);
/**
 * @route   GET /api/v1/admin/financial/data
 * @desc    Get financial chart data
 * @access  Private/Admin
 */
router.get('/financial/data', (0, auth_1.requirePermission)('financial', 'read'), AdminController_1.default.getFinancialData);
/**
 * @route   GET /api/v1/admin/financial/transactions
 * @desc    Get transaction summary
 * @access  Private/Admin
 */
router.get('/financial/transactions', (0, auth_1.requirePermission)('financial', 'read'), AdminController_1.default.getFinancialTransactions);
/**
 * @route   GET /api/v1/admin/financial/export
 * @desc    Export financial data
 * @access  Private/Admin
 */
router.get('/financial/export', (0, auth_1.requirePermission)('financial', 'read'), AdminController_1.default.exportFinancialData);
/**
 * @route   GET /api/v1/admin/incidents
 * @desc    Get all incidents
 * @access  Private/Admin
 */
router.get('/incidents', (0, auth_1.requirePermission)('incidents', 'read'), AdminController_1.default.getIncidents);
/**
 * @route   PUT /api/v1/admin/incidents/:id
 * @desc    Update incident status
 * @access  Private/Admin
 */
router.put('/incidents/:id', (0, auth_1.requirePermission)('incidents', 'update'), AdminController_1.default.updateIncident);
/**
 * @route   GET /api/v1/admin/reviews
 * @desc    Get all reviews (Admin only)
 * @access  Private/Admin
 */
router.get('/reviews', (0, auth_1.requirePermission)('reviews', 'read'), AdminController_1.default.getAllReviews);
/**
 * @route   POST /api/v1/admin/reviews
 * @desc    Create new review (Admin only)
 * @access  Private/Admin
 */
router.post('/reviews', (0, auth_1.requirePermission)('reviews', 'create'), AdminController_1.default.createReview);
/**
 * @route   PUT /api/v1/admin/reviews/:id
 * @desc    Update review (Admin only)
 * @access  Private/Admin
 */
router.put('/reviews/:id', (0, auth_1.requirePermission)('reviews', 'update'), AdminController_1.default.updateReview);
/**
 * @route   PUT /api/v1/admin/reviews/:id/moderate
 * @desc    Moderate review (Admin only)
 * @access  Private/Admin
 */
router.put('/reviews/:id/moderate', (0, auth_1.requirePermission)('reviews', 'update'), AdminController_1.default.moderateReview);
/**
 * @route   DELETE /api/v1/admin/reviews/:id
 * @desc    Delete review (Admin only)
 * @access  Private/Admin
 */
router.delete('/reviews/:id', (0, auth_1.requirePermission)('reviews', 'delete'), AdminController_1.default.deleteReview);
/**
 * @route   GET /api/v1/admin/activity-logs
 * @desc    Get system activity logs
 * @access  Private/Admin
 */
router.get('/activity-logs', (0, auth_1.requirePermission)('logs', 'read'), AdminController_1.default.getActivityLogs);
/**
 * @route   GET /api/v1/admin/roles
 * @desc    Get all roles
 * @access  Private/Admin
 */
router.get('/roles', (0, auth_1.requirePermission)('roles', 'read'), AdminController_1.default.getRoles);
/**
 * @route   POST /api/v1/admin/roles
 * @desc    Create new role
 * @access  Private/Admin
 */
router.post('/roles', (0, auth_1.requirePermission)('roles', 'create'), AdminController_1.default.createRole);
/**
 * @route   PUT /api/v1/admin/roles/:id
 * @desc    Update role
 * @access  Private/Admin
 */
router.put('/roles/:id', (0, auth_1.requirePermission)('roles', 'update'), AdminController_1.default.updateRole);
/**
 * @route   PUT /api/v1/admin/roles/:id/assign
 * @desc    Assign role to employees
 * @access  Private/Admin
 */
router.put('/roles/:id/assign', (0, auth_1.requirePermission)('roles', 'update'), AdminController_1.default.assignRoleToEmployees);
/**
 * @route   DELETE /api/v1/admin/roles/:id
 * @desc    Delete role
 * @access  Private/Admin
 */
router.delete('/roles/:id', (0, auth_1.requirePermission)('roles', 'delete'), AdminController_1.default.deleteRole);
/**
 * @route   GET /api/v1/admin/permissions
 * @desc    Get all permissions
 * @access  Private/Admin
 */
router.get('/permissions', (0, auth_1.requirePermission)('permissions', 'read'), AdminController_1.default.getPermissions);
/**
 * @route   PUT /api/v1/admin/roles/:id/permissions
 * @desc    Update role permissions
 * @access  Private/Admin
 */
router.put('/roles/:id/permissions', (0, auth_1.requirePermission)('roles', 'update'), AdminController_1.default.updateRolePermissions);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map