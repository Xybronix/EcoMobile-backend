import { prisma } from '../config/prisma';
import { SubscriptionType } from '@prisma/client';
import WalletService from './WalletService';
import NotificationService from './NotificationService';

interface SubscribeRequest {
  planId: string;
  packageType: SubscriptionType;
  startDate: Date;
}

class SubscriptionService {
  async getAvailablePlans() {
    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      include: { pricingConfig: true },
      orderBy: { hourlyRate: 'asc' }
    });

    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      type: plan.type,
      hourlyRate: plan.hourlyRate,
      dailyRate: plan.dailyRate,
      weeklyRate: plan.weeklyRate,
      monthlyRate: plan.monthlyRate,
      discount: plan.discount,
      features: this.getPlanFeatures(plan),
      isPopular: plan.name.toLowerCase().includes('standard')
    }));
  }

  async getCurrentSubscription(userId: string) {
    // Vérifier d'abord les réservations actives
    const activeReservation = await prisma.reservation.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: { plan: true, bike: true }
    });

    if (activeReservation) {
      return {
        id: activeReservation.id,
        planName: activeReservation.plan.name,
        packageType: activeReservation.packageType,
        startDate: activeReservation.startDate,
        endDate: activeReservation.endDate,
        status: 'ACTIVE',
        type: 'RESERVATION',
        bikeCode: activeReservation.bike.code,
        remainingDays: Math.ceil(
          (activeReservation.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
      };
    }

    // Sinon vérifier les abonnements généraux
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: { plan: true }
    });

    if (!subscription) return null;

    return {
      id: subscription.id,
      planName: subscription.plan.name,
      packageType: subscription.type,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      status: 'ACTIVE',
      type: 'SUBSCRIPTION',
      remainingDays: Math.ceil(
        (subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    };
  }

  async subscribe(userId: string, data: SubscribeRequest) {
    // Vérifier le plan
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: data.planId }
    });

    if (!plan) {
      throw new Error('Plan non trouvé');
    }

    // Calculer le prix selon le type
    let price = 0;
    let endDate = new Date(data.startDate);

    switch (data.packageType) {
      case SubscriptionType.DAILY:
        price = plan.dailyRate;
        endDate.setDate(endDate.getDate() + 1);
        break;
      case SubscriptionType.WEEKLY:
        price = plan.weeklyRate;
        endDate.setDate(endDate.getDate() + 7);
        break;
      case SubscriptionType.MONTHLY:
        price = plan.monthlyRate;
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      default:
        throw new Error('Type d\'abonnement invalide');
    }

    // Vérifier le solde
    const balance = await WalletService.getBalance(userId);
    if (balance.balance < price) {
      throw new Error('Solde insuffisant');
    }

    // Vérifier qu'il n'y a pas déjà un abonnement actif
    const existingSubscription = await this.getCurrentSubscription(userId);
    if (existingSubscription) {
      throw new Error('Vous avez déjà un abonnement actif');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Créer l'abonnement
      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId: data.planId,
          type: data.packageType,
          startDate: data.startDate,
          endDate,
          isActive: true
        },
        include: { plan: true }
      });

      // Déduire du wallet
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Portefeuille non trouvé');

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: price } }
      });

      // Créer la transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'SUBSCRIPTION_PAYMENT',
          amount: price,
          fees: 0,
          totalAmount: price,
          status: 'COMPLETED',
          paymentMethod: 'WALLET',
          metadata: { 
            subscriptionId: subscription.id,
            planName: plan.name,
            packageType: data.packageType
          }
        }
      });

      return subscription;
    });

    // Notification
    await NotificationService.createNotification({
      userId,
      title: 'Abonnement activé',
      message: `Votre abonnement ${plan.name} - ${data.packageType} est maintenant actif jusqu'au ${endDate.toLocaleDateString()}`,
      type: 'SUBSCRIPTION'
    });

    return result;
  }

  async cancelSubscription(subscriptionId: string, userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
      include: { plan: true }
    });

    if (!subscription) {
      throw new Error('Abonnement non trouvé');
    }

    if (!subscription.isActive) {
      throw new Error('L\'abonnement est déjà inactif');
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { isActive: false }
    });

    // Notification
    await NotificationService.createNotification({
      userId,
      title: 'Abonnement annulé',
      message: `Votre abonnement ${subscription.plan.name} a été annulé`,
      type: 'SUBSCRIPTION'
    });
  }

  private getPlanFeatures(plan: any): string[] {
    const features = ['Vélos électriques'];
    
    if (plan.discount > 0) {
      features.push(`${plan.discount}% de réduction`);
    }
    
    if (plan.name.toLowerCase().includes('premium')) {
      features.push('Support prioritaire', 'Vélos premium');
    }
    
    if (plan.name.toLowerCase().includes('étudiant')) {
      features.push('Tarif étudiant', 'Accès aux campus');
    }

    features.push('Accès 24h/24');
    
    return features;
  }
}

export default new SubscriptionService();