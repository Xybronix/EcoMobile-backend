import express from 'express';
import SubscriptionPackageAdminController from '../controllers/SubscriptionPackageAdminController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

// Subscription packages management
router.post('/packages', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.createPackage);
router.get('/packages', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.getAllPackages);
router.get('/packages/:id', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.getPackageById);
router.put('/packages/:id', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.updatePackage);
router.delete('/packages/:id', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.deletePackage);

// Subscription formulas management
router.post('/formulas', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.createFormula);
router.get('/packages/:packageId/formulas', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.getFormulasByPackage);
router.put('/formulas/:id', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.updateFormula);
router.delete('/formulas/:id', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.deleteFormula);

// Subscription promotions management
router.post('/promotions', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.createPromotion);
router.get('/promotions', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.getAllPromotions);
router.put('/promotions/:id', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.updatePromotion);
router.delete('/promotions/:id', authenticate, requirePermission('admin', 'read'), SubscriptionPackageAdminController.deletePromotion);

export default router;
