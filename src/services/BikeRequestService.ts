import { prisma } from '../config/prisma';
import { RequestStatus, SubscriptionType } from '@prisma/client';
import NotificationService from './NotificationService';

export class BikeRequestService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Créer une demande de déverrouillage
   */
  async createUnlockRequest(userId: string, bikeId: string, metadata?: any): Promise<any> {
    // Vérifier la caution
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    const requiredDeposit = await this.getRequiredDeposit();
    if (!user || user.depositBalance < requiredDeposit) {
      throw new Error(`Caution insuffisante. Minimum requis: ${requiredDeposit} FCFA`);
    }

    // Vérifier qu'il n'y a pas déjà une demande en attente
    const existingRequest = await prisma.unlockRequest.findFirst({
      where: {
        userId,
        status: RequestStatus.PENDING
      }
    });

    if (existingRequest) {
      throw new Error('Vous avez déjà une demande en attente');
    }

    const request = await prisma.unlockRequest.create({
      data: {
        userId,
        bikeId,
        status: RequestStatus.PENDING,
        metadata: metadata || {}
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        bike: { select: { code: true, model: true } }
      }
    });

    // Notifier les admins
    await this.notifyAdmins('unlock', request);

    return request;
  }

  /**
   * Créer une demande de verrouillage
   */
  async createLockRequest(userId: string, bikeId: string, rideId?: string, location?: { lat: number; lng: number }, metadata?: any): Promise<any> {
    const request = await prisma.lockRequest.create({
      data: {
        userId,
        bikeId,
        rideId,
        latitude: location?.lat,
        longitude: location?.lng,
        status: RequestStatus.PENDING,
        metadata: metadata || {}
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        bike: { select: { code: true, model: true } }
      }
    });

    // Notifier les admins
    await this.notifyAdmins('lock', request);

    return request;
  }

  /**
   * Valider une demande de déverrouillage (admin)
   */
  async approveUnlockRequest(requestId: string, adminId: string): Promise<any> {
    const request = await prisma.unlockRequest.findUnique({
      where: { id: requestId },
      include: { bike: true, user: true }
    });

    if (!request || request.status !== RequestStatus.PENDING) {
      throw new Error('Demande non trouvée ou déjà traitée');
    }

    await prisma.$transaction(async (tx) => {
      // Valider la demande
      await tx.unlockRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.APPROVED,
          validatedAt: new Date(),
          validatedBy: adminId
        }
      });

      // Déverrouiller le vélo
      await tx.bike.update({
        where: { id: request.bikeId },
        data: { status: 'IN_USE' }
      });
    });

    // Notifier l'utilisateur
    await this.notificationService.createNotification({
      userId: request.userId,
      title: 'Déverrouillage validé',
      message: `Votre demande de déverrouillage du vélo ${request.bike.code} a été approuvée`,
      type: 'UNLOCK_APPROVED'
    });

    return request;
  }

  /**
   * Rejeter une demande de déverrouillage (admin)
   */
  async rejectUnlockRequest(requestId: string, adminId: string, reason: string): Promise<any> {
    const request = await prisma.unlockRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        rejectedAt: new Date(),
        validatedBy: adminId,
        rejectionReason: reason
      },
      include: { user: true, bike: true }
    });

    // Notifier l'utilisateur
    await this.notificationService.createNotification({
      userId: request.userId,
      title: 'Déverrouillage refusé',
      message: `Votre demande de déverrouillage a été refusée. Raison: ${reason}`,
      type: 'UNLOCK_REJECTED'
    });

    return request;
  }

  /**
   * Valider une demande de verrouillage (admin)
   */
  async approveLockRequest(requestId: string, adminId: string): Promise<any> {
    const request = await prisma.lockRequest.findUnique({
      where: { id: requestId },
      include: { bike: true, user: true, ride: true }
    });

    if (!request || request.status !== RequestStatus.PENDING) {
      throw new Error('Demande non trouvée ou déjà traitée');
    }

    await prisma.$transaction(async (tx) => {
      // Valider la demande
      await tx.lockRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.APPROVED,
          validatedAt: new Date(),
          validatedBy: adminId
        }
      });

      // Verrouiller le vélo
      await tx.bike.update({
        where: { id: request.bikeId },
        data: { 
          status: 'AVAILABLE',
          latitude: request.latitude,
          longitude: request.longitude
        }
      });

      // Terminer le trajet si spécifié
      if (request.rideId && request.ride) {
        const ride = request.ride;

        if (ride.status === 'IN_PROGRESS') {
          const duration = Math.floor((new Date().getTime() - ride.startTime.getTime()) / 1000 / 60);
          const cost = await this.calculateRideCost(request.userId, duration, ride.planId || undefined);

          await tx.ride.update({
            where: { id: request.rideId },
            data: {
              endTime: new Date(),
              endLatitude: request.latitude,
              endLongitude: request.longitude,
              duration,
              cost,
              status: 'COMPLETED'
            }
          });

          // Déduire du wallet/caution
          await this.processPayment(request.userId, cost);
        }
      }
    });

    return request;
  }

  /**
   * Calculer le coût avec pricing étendu
   */
  private async calculateRideCost(userId: string, duration: number, planId?: string): Promise<number> {
    // Récupérer l'abonnement actif de l'utilisateur
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: { plan: { include: { overrides: true } } }
    });

    if (activeSubscription) {
      // L'utilisateur a un forfait actif
      const plan = activeSubscription.plan;
      const durationHours = duration / 60;
      
      if (activeSubscription.type === SubscriptionType.DAILY && durationHours > 24) {
        // Dépassement du forfait journalier
        const override = plan.overrides?.[0];
        if (override) {
          if (override.overTimeType === 'FIXED_PRICE') {
            return override.overTimeValue;
          } else if (override.overTimeType === 'PERCENTAGE_REDUCTION') {
            const normalPrice = plan.hourlyRate * (durationHours - 24);
            return normalPrice * (1 - override.overTimeValue / 100);
          }
        }
      }
      
      // Pas de dépassement, utiliser le forfait
      return 0; // Déjà payé avec le forfait
    } else {
      // Pas d'abonnement, prix normal selon les règles
      const plan = await prisma.pricingPlan.findUnique({
        where: { id: planId || '' }
      });
      
      return plan ? plan.hourlyRate * (duration / 60) : 200 * (duration / 60);
    }
  }

  /**
   * Traiter le paiement (wallet puis caution si nécessaire)
   */
  private async processPayment(userId: string, amount: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      throw new Error('Utilisateur ou portefeuille non trouvé');
    }

    const wallet = user.wallet;

    if (wallet.balance >= amount) {
      // Déduire du wallet
      await prisma.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: { decrement: amount } }
      });
    } else {
      // Déduire du wallet puis de la caution
      const remainingAmount = amount - wallet.balance;
      
      if (user.depositBalance < remainingAmount) {
        throw new Error('Solde et caution insuffisants');
      }

      await prisma.$transaction(async (tx) => {
        // Vider le wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: 0 }
        });

        // Déduire de la caution
        await tx.user.update({
          where: { id: userId },
          data: { depositBalance: { decrement: remainingAmount } }
        });

        // Créer transaction pour caution
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'RIDE_PAYMENT',
            amount: remainingAmount,
            fees: 0,
            totalAmount: remainingAmount,
            status: 'COMPLETED',
            paymentMethod: 'DEPOSIT',
            metadata: { source: 'deposit_deduction' }
          }
        });
      });
    }
  }

  /**
   * Obtenir les demandes en attente (admin)
   */
  async getPendingRequests(type: 'unlock' | 'lock', page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    if (type === 'unlock') {
      const [requests, total] = await Promise.all([
        prisma.unlockRequest.findMany({
          where: { status: RequestStatus.PENDING },
          include: {
            user: { select: { firstName: true, lastName: true } },
            bike: { select: { code: true, model: true, latitude: true, longitude: true } }
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit
        }),
        prisma.unlockRequest.count({ where: { status: RequestStatus.PENDING } })
      ]);

      return { requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } else {
      const [requests, total] = await Promise.all([
        prisma.lockRequest.findMany({
          where: { status: RequestStatus.PENDING },
          include: {
            user: { select: { firstName: true, lastName: true } },
            bike: { select: { code: true, model: true } }
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit
        }),
        prisma.lockRequest.count({ where: { status: RequestStatus.PENDING } })
      ]);

      return { requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
  }

  private async notifyAdmins(type: 'unlock' | 'lock', request: any) {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: true
      }
    });

    for (const admin of admins) {
      await this.notificationService.createNotification({
        userId: admin.id,
        title: `Demande de ${type === 'unlock' ? 'déverrouillage' : 'verrouillage'}`,
        message: `${request.user.firstName} ${request.user.lastName} demande ${type === 'unlock' ? 'à déverrouiller' : 'à verrouiller'} le vélo ${request.bike.code}`,
        type: type === 'unlock' ? 'UNLOCK_REQUEST' : 'LOCK_REQUEST'
      });
    }
  }

  private async getRequiredDeposit(): Promise<number> {
    const setting = await prisma.settings.findUnique({
      where: { key: 'required_deposit' }
    });
    return setting ? parseFloat(setting.value) : 20000;
  }
}

export default new BikeRequestService();