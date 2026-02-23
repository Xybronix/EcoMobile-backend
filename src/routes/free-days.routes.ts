import express from 'express';
import FreeDaysRuleController from '../controllers/FreeDaysRuleController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/v1/free-days
 * @desc    Create new free days rule (admin only)
 * @access  Private/Admin
 */
router.post('/', authenticate, requirePermission('admin', 'read'), FreeDaysRuleController.createRule);

/**
 * @route   GET /api/v1/free-days
 * @desc    Get all free days rules (admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, requirePermission('admin', 'read'), FreeDaysRuleController.getAllRules);

/**
 * @route   GET /api/v1/free-days/users/search
 * @desc    Search users to manually add to a free days rule (admin only)
 * @access  Private/Admin
 */
router.get('/users/search', authenticate, requirePermission('admin', 'read'), FreeDaysRuleController.searchUsers);

/**
 * @route   GET /api/v1/free-days/:id
 * @desc    Récupérer une règle de jours gratuits par ID (avec ses bénéficiaires)
 * @access  Private/Admin
 */
router.get('/:id', authenticate, requirePermission('admin', 'read'), FreeDaysRuleController.getRuleById);

/**
 * @route   PUT /api/v1/free-days/:id
 * @desc    Update rule of free days (admin only)
 * @access  Private/Admin
 */
router.put('/:id', authenticate, requirePermission('admin', 'read'), FreeDaysRuleController.updateRule);

/**
 * @route   DELETE /api/v1/free-days/:id
 * @desc    Delete rule of free days (admin only)
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, requirePermission('admin', 'read'), FreeDaysRuleController.deleteRule);

/**
 * @route   POST /api/v1/free-days/:id/beneficiaries
 * @desc    Add a manual beneficiary to a free days rule (admin only)
 * @access  Private/Admin
 */
router.post('/:id/beneficiaries', authenticate, requirePermission('admin', 'read'), FreeDaysRuleController.addBeneficiary);

/**
 * @route   DELETE /api/v1/free-days/:id/beneficiaries/:userId
 * @desc    Delete a beneficiary from a free days rule (admin only)
 * @access  Private/Admin
 */
router.delete('/:id/beneficiaries/:userId', authenticate, requirePermission('admin', 'read'), FreeDaysRuleController.removeBeneficiary);

export default router;
