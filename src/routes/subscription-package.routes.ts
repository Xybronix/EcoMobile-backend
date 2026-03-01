import express from 'express';
import SubscriptionPackageAdminController from '../controllers/SubscriptionPackageAdminController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

// Subscription packages management
router.post('/packages', authenticate, requirePermission('subscriptions', 'create'), SubscriptionPackageAdminController.createPackage);
router.get('/packages', authenticate, requirePermission('subscriptions', 'read'), SubscriptionPackageAdminController.getAllPackages);
router.get('/packages/:id', authenticate, requirePermission('subscriptions', 'read'), SubscriptionPackageAdminController.getPackageById);
router.put('/packages/:id', authenticate, requirePermission('subscriptions', 'update'), SubscriptionPackageAdminController.updatePackage);
router.delete('/packages/:id', authenticate, requirePermission('subscriptions', 'delete'), SubscriptionPackageAdminController.deletePackage);

// Subscription formulas management
router.post('/formulas', authenticate, requirePermission('subscriptions', 'create'), SubscriptionPackageAdminController.createFormula);
router.get('/packages/:packageId/formulas', authenticate, requirePermission('subscriptions', 'read'), SubscriptionPackageAdminController.getFormulasByPackage);
router.put('/formulas/:id', authenticate, requirePermission('subscriptions', 'update'), SubscriptionPackageAdminController.updateFormula);
router.delete('/formulas/:id', authenticate, requirePermission('subscriptions', 'delete'), SubscriptionPackageAdminController.deleteFormula);

// Subscription promotions management
router.post('/promotions', authenticate, requirePermission('pricing', 'create'), SubscriptionPackageAdminController.createPromotion);
router.get('/promotions', authenticate, requirePermission('pricing', 'read'), SubscriptionPackageAdminController.getAllPromotions);
router.put('/promotions/:id', authenticate, requirePermission('pricing', 'update'), SubscriptionPackageAdminController.updatePromotion);
router.delete('/promotions/:id', authenticate, requirePermission('pricing', 'delete'), SubscriptionPackageAdminController.deletePromotion);

export default router;
