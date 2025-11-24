import express from 'express';
import { AuthRequest, logActivity } from '../middleware/auth';
import SubscriptionService from '../services/SubscriptionService';
import { SubscriptionType } from '@prisma/client';

class SubscriptionController {
  async getAvailablePlans(_req: AuthRequest, res: express.Response) {
    try {
      const plans = await SubscriptionService.getAvailablePlans();
      
      res.json({
        success: true,
        data: { plans }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getCurrentSubscription(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const subscription = await SubscriptionService.getCurrentSubscription(userId);

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

  async subscribe(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { planId, packageType, startDate } = req.body;

      let subscriptionType: SubscriptionType;
      switch (packageType?.toLowerCase()) {
        case 'daily':
          subscriptionType = SubscriptionType.DAILY;
          break;
        case 'weekly':
          subscriptionType = SubscriptionType.WEEKLY;
          break;
        case 'monthly':
          subscriptionType = SubscriptionType.MONTHLY;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Type d\'abonnement invalide. Doit être: daily, weekly ou monthly'
          });
      }
      
      const subscription = await SubscriptionService.subscribe(userId, {
        planId,
        packageType: subscriptionType,
        startDate: new Date(startDate)
      });

      await logActivity(
        userId,
        'CREATE',
        'SUBSCRIPTION',
        subscription.id,
        `Subscribed to ${packageType} plan`,
        { planId, packageType },
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

  async cancelSubscription(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await SubscriptionService.cancelSubscription(id, userId);

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
}

export default new SubscriptionController();