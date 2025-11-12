import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class AdminController {
    /**
     * @swagger
     * /admin/dashboard:
     *   get:
     *     summary: Get dashboard statistics (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Dashboard statistics retrieved
     */
    getDashboardStats(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/settings:
     *   get:
     *     summary: Get app settings (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Settings retrieved
     */
    getSettings(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/settings:
     *   put:
     *     summary: Update app settings (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             additionalProperties:
     *               type: string
     *     responses:
     *       200:
     *         description: Settings updated
     */
    updateSettings(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/pricing:
     *   get:
     *     summary: Get pricing configuration (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Pricing retrieved
     */
    getPricing(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/pricing:
     *   put:
     *     summary: Update pricing configuration (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               unlockFee:
     *                 type: number
     *               baseHourlyRate:
     *                 type: number
     *               plans:
     *                 type: array
     *                 items:
     *                   type: object
     *               rules:
     *                 type: array
     *                 items:
     *                   type: object
     *     responses:
     *       200:
     *         description: Pricing updated
     */
    updatePricing(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/pricing/current:
     *   get:
     *     summary: Get current pricing with applied rules and promotions
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: date
     *         schema:
     *           type: string
     *           format: date
     *         description: Target date
     *       - in: query
     *         name: hour
     *         schema:
     *           type: integer
     *           minimum: 0
     *           maximum: 23
     *         description: Target hour
     *     responses:
     *       200:
     *         description: Current pricing retrieved successfully
     */
    getCurrentPricing(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/promotions:
     *   get:
     *     summary: Get all promotions (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Promotions retrieved successfully
     */
    getPromotions(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/promotions:
     *   post:
     *     summary: Create new promotion (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - discountType
     *               - discountValue
     *               - startDate
     *               - endDate
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               discountType:
     *                 type: string
     *                 enum: [PERCENTAGE, FIXED_AMOUNT]
     *               discountValue:
     *                 type: number
     *               startDate:
     *                 type: string
     *                 format: date-time
     *               endDate:
     *                 type: string
     *                 format: date-time
     *               usageLimit:
     *                 type: number
     *               planIds:
     *                 type: array
     *                 items:
     *                   type: string
     *               conditions:
     *                 type: object
     *     responses:
     *       200:
     *         description: Promotion created successfully
     */
    createPromotion(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/promotions/{id}:
     *   put:
     *     summary: Update promotion (Admin only)
     *     tags: [Admin]
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
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               discountType:
     *                 type: string
     *                 enum: [PERCENTAGE, FIXED_AMOUNT]
     *               discountValue:
     *                 type: number
     *               startDate:
     *                 type: string
     *                 format: date-time
     *               endDate:
     *                 type: string
     *                 format: date-time
     *               usageLimit:
     *                 type: number
     *               planIds:
     *                 type: array
     *                 items:
     *                   type: string
     *               conditions:
     *                 type: object
     *     responses:
     *       200:
     *         description: Promotion updated successfully
     */
    updatePromotion(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/promotions/{id}/status:
     *   patch:
     *     summary: Toggle promotion status (Admin only)
     *     tags: [Admin]
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
     *         description: Promotion status updated
     */
    togglePromotionStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/plans/{id}:
     *   delete:
     *     summary: Delete pricing plan (Admin only)
     *     tags: [Admin]
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
     *         description: Plan deleted successfully
     */
    deletePlan(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/rules/{id}:
     *   delete:
     *     summary: Delete pricing rule (Admin only)
     *     tags: [Admin]
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
     *         description: Rule deleted successfully
     */
    deleteRule(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/promotions/{id}:
     *   delete:
     *     summary: Delete promotion (Admin only)
     *     tags: [Admin]
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
     *         description: Promotion deleted successfully
     */
    deletePromotion(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/financial/stats:
     *   get:
     *     summary: Get financial statistics
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [both, revenue, expenses]
     *     responses:
     *       200:
     *         description: Financial statistics retrieved
     */
    getFinancialStats(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/financial/data:
     *   get:
     *     summary: Get financial chart data
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Financial chart data retrieved
     */
    getFinancialData(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/financial/transactions:
     *   get:
     *     summary: Get transaction summary
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Transaction summary retrieved
     */
    getFinancialTransactions(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/financial/export:
     *   get:
     *     summary: Export financial data
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: format
     *         schema:
     *           type: string
     *           enum: [csv, json]
     *           default: csv
     *     responses:
     *       200:
     *         description: Financial data exported
     */
    exportFinancialData(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/incidents:
     *   get:
     *     summary: Get all incidents (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
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
     *         description: Incidents retrieved
     */
    getIncidents(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/incidents/{id}:
     *   put:
     *     summary: Update incident (Admin only)
     *     tags: [Admin]
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
     *               status:
     *                 type: string
     *                 enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
     *               priority:
     *                 type: string
     *               refundAmount:
     *                 type: number
     *               adminNote:
     *                 type: string
     *     responses:
     *       200:
     *         description: Incident updated
     */
    updateIncident(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /public/reviews:
     *   get:
     *     summary: Get approved reviews (public)
     *     tags: [Public]
     *     responses:
     *       200:
     *         description: Approved reviews retrieved successfully
     */
    getApprovedReviews(_req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /public/reviews:
     *   post:
     *     summary: Submit a review (public)
     *     tags: [Public]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - firstName
     *               - lastName
     *               - socialStatus
     *               - rating
     *               - comment
     *             properties:
     *               photo:
     *                 type: string
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               socialStatus:
     *                 type: string
     *               rating:
     *                 type: integer
     *                 minimum: 1
     *                 maximum: 5
     *               comment:
     *                 type: string
     *     responses:
     *       200:
     *         description: Review submitted successfully
     */
    submitReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/reviews:
     *   get:
     *     summary: Get all reviews (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [pending, approved, rejected]
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
     *         description: Reviews retrieved successfully
     */
    getAllReviews(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/reviews:
     *   post:
     *     summary: Create new review (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - firstName
     *               - lastName
     *               - socialStatus
     *               - rating
     *               - comment
     *             properties:
     *               photo:
     *                 type: string
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               socialStatus:
     *                 type: string
     *               rating:
     *                 type: integer
     *               comment:
     *                 type: string
     *     responses:
     *       200:
     *         description: Review created successfully
     */
    createReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/reviews/{id}:
     *   put:
     *     summary: Update review (Admin only)
     *     tags: [Admin]
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
     *               photo:
     *                 type: string
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               socialStatus:
     *                 type: string
     *               rating:
     *                 type: integer
     *               comment:
     *                 type: string
     *     responses:
     *       200:
     *         description: Review updated successfully
     */
    updateReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/reviews/{id}/moderate:
     *   put:
     *     summary: Moderate review (Admin only)
     *     tags: [Admin]
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
     *               - action
     *             properties:
     *               action:
     *                 type: string
     *                 enum: [approve, reject]
     *               moderatorComment:
     *                 type: string
     *     responses:
     *       200:
     *         description: Review moderated successfully
     */
    moderateReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/reviews/{id}:
     *   delete:
     *     summary: Delete review (Admin only)
     *     tags: [Admin]
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
     *         description: Review deleted successfully
     */
    deleteReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/activity-logs:
     *   get:
     *     summary: Get activity logs (Admin only)
     *     tags: [Admin]
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
     *         name: action
     *         schema:
     *           type: string
     *       - in: query
     *         name: resource
     *         schema:
     *           type: string
     *       - in: query
     *         name: userId
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Activity logs retrieved
     */
    getActivityLogs(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/roles:
     *   get:
     *     summary: Get all roles (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Roles retrieved successfully
     */
    getRoles(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/roles:
     *   post:
     *     summary: Create new role (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               permissions:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Role created successfully
     */
    createRole(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/roles/{id}:
     *   put:
     *     summary: Update role (Admin only)
     *     tags: [Admin]
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
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               permissions:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Role updated successfully
     */
    updateRole(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * @swagger
     * /admin/roles/{id}:
     *   delete:
     *     summary: Delete role (Admin only)
     *     tags: [Admin]
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
     *         description: Role deleted successfully
     */
    deleteRole(req: AuthRequest, res: Response): Promise<Response>;
    /**
     * @swagger
     * /admin/roles/{id}/assign:
     *   put:
     *     summary: Assign role to employees (Admin only)
     *     tags: [Admin]
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
     *               - employeeIds
     *             properties:
     *               employeeIds:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Role assigned successfully
     */
    assignRoleToEmployees(req: AuthRequest, res: Response): Promise<Response>;
    /**
     * @swagger
     * /admin/permissions:
     *   get:
     *     summary: Get all permissions (Admin only)
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Permissions retrieved successfully
     */
    getPermissions(req: AuthRequest, res: Response): Promise<void>;
    /**
     * @swagger
     * /admin/roles/{id}/permissions:
     *   put:
     *     summary: Update role permissions (Admin only)
     *     tags: [Admin]
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
     *             properties:
     *               permissions:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Role permissions updated successfully
     */
    updateRolePermissions(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: AdminController;
export default _default;
//# sourceMappingURL=AdminController.d.ts.map