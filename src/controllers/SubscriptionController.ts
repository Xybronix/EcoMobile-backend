import express from 'express';
import { AuthRequest, logActivity } from '../middleware/auth';
import SubscriptionPackageService from '../services/SubscriptionPackageService';

class SubscriptionController {
  /**
   * @swagger
   * /subscriptions/packages:
   *   get:
   *     summary: Get available subscription packages
   *     tags: [Subscriptions]
   *     responses:
   *       200:
   *         description: List of available subscription packages
   */
  async getAvailablePackages(_req: AuthRequest, res: express.Response) {
    try {
      const packages = await SubscriptionPackageService.getAvailablePackages();
      
      res.json({
        success: true,
        data: { packages }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /subscriptions/packages/{id}:
   *   get:
   *     summary: Get package details with formulas
   *     tags: [Subscriptions]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   */
  async getPackageDetails(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const pkg = await SubscriptionPackageService.getPackageDetails(id);

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Forfait non trouvé'
        });
      }

      return res.json({
        success: true,
        data: pkg
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /subscriptions/current:
   *   get:
   *     summary: Get current active subscription
   *     tags: [Subscriptions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current subscription details
   */
  async getCurrentSubscription(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const subscription = await SubscriptionPackageService.getCurrentSubscription(userId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Aucun abonnement actif',
          data: null
        });
      }

      return res.json({
        success: true,
        data: subscription
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /subscriptions:
   *   post:
   *     summary: Subscribe to a formula
   *     tags: [Subscriptions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - formulaId
   *             properties:
   *               formulaId:
   *                 type: string
   *               startDate:
   *                 type: string
   *                 format: date-time
   */
  async subscribe(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { formulaId, startDate } = req.body;

      if (!formulaId) {
        return res.status(400).json({
          success: false,
          message: 'formulaId est requis'
        });
      }

      const subscription = await SubscriptionPackageService.subscribeToFormula(userId, {
        formulaId,
        startDate: startDate ? new Date(startDate) : undefined
      });

      await logActivity(
        userId,
        'CREATE',
        'SUBSCRIPTION',
        subscription.id,
        `Subscribed to formula ${subscription.formula?.name ?? ''}`,
        { formulaId },
        req
      );

      return res.status(201).json({
        success: true,
        message: 'Abonnement créé avec succès',
        data: subscription
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /subscriptions/{id}/cancel:
   *   post:
   *     summary: Cancel a subscription
   *     tags: [Subscriptions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   */
  async cancelSubscription(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await SubscriptionPackageService.cancelSubscription(id, userId);

      await logActivity(
        userId,
        'UPDATE',
        'SUBSCRIPTION',
        id,
        'Cancelled subscription',
        { subscriptionId: id },
        req
      );

      res.json({
        success: true,
        message: 'Abonnement annulé'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /subscriptions/{id}/change:
   *   post:
   *     summary: Change subscription to a different formula
   *     tags: [Subscriptions]
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
   *               - newFormulaId
   *             properties:
   *               newFormulaId:
   *                 type: string
   */
  async changeSubscription(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { newFormulaId } = req.body;

      if (!newFormulaId) {
        return res.status(400).json({
          success: false,
          message: 'newFormulaId est requis'
        });
      }

      const newSubscription = await SubscriptionPackageService.changeSubscription(id, userId, newFormulaId);

      await logActivity(
        userId,
        'UPDATE',
        'SUBSCRIPTION',
        id,
        `Changed subscription to formula ${newSubscription.formula?.name ?? ''}`,
        { subscriptionId: id, newFormulaId },
        req
      );

      return res.json({
        success: true,
        message: 'Abonnement modifié avec succès',
        data: newSubscription
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new SubscriptionController();