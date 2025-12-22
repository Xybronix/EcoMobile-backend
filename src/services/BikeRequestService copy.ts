import { prisma } from '../config/prisma';
import { RequestStatus, SubscriptionType, BikeStatus } from '@prisma/client';
import NotificationService from './NotificationService';
import { imageService } from './ImageService';

export class BikeRequestService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Créer une demande de déverrouillage
   */
  async createUnlockRequest(userId: string, bikeId: string, metadata?: any, req?: any): Promise<any> {
    // Vérifier la caution
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    const requiredDeposit = await this.getRequiredDeposit();
    
    if (!user || !user.wallet) {
      throw new Error('Portefeuille non trouvé');
    }

    if (user.wallet.deposit < requiredDeposit) {
      throw new Error(`Caution insuffisante. Minimum requis : ${requiredDeposit} FCFA. Votre caution actuelle est de : ${user.wallet.deposit} FCFA`);
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

    // Vérifier qu'il n'y a pas de trajet en cours
    const activeRide = await prisma.ride.findFirst({
      where: {
        userId,
        status: 'IN_PROGRESS'
      }
    });

    if (activeRide) {
      throw new Error('Vous avez déjà un trajet en cours');
    }

    // Traiter les images si présentes
    let processedMetadata = metadata;
    if (metadata?.inspection?.photos) {
      const savedImagePaths = await imageService.saveMultipleImages(metadata.inspection.photos);
      processedMetadata = {
        ...metadata,
        inspection: {
          ...metadata.inspection,
          photos: savedImagePaths
        }
      };
    }

    // Vérifier aussi dans inspectionData (nouvelle structure)
    if (metadata?.inspectionData?.photos) {
      const savedImagePaths = await imageService.saveMultipleImages(metadata.inspectionData.photos);
      processedMetadata = {
        ...metadata,
        inspectionData: {
          ...metadata.inspectionData,
          photos: savedImagePaths
        }
      };
    }

    const request = await prisma.unlockRequest.create({
      data: {
        userId,
        bikeId,
        status: RequestStatus.PENDING,
        metadata: processedMetadata || {}
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        bike: { select: { code: true, model: true } }
      }
    });

    const responseMetadata = this.prepareMetadataForResponse(request.metadata, req);

    const response = {
      ...request,
      metadata: responseMetadata
    };

    // Notifier les admins
    await this.notifyAdmins('unlock', request);

    return response;
  }

  /**
   * Créer une demande de verrouillage
   */
  async createLockRequest(userId: string, bikeId: string, rideId?: string, location?: { lat: number; lng: number }, metadata?: any, req?: any): Promise<any> {
    // Traiter les images si présentes
    let processedMetadata = metadata;
    if (metadata?.inspection?.photos) {
      const savedImagePaths = await imageService.saveMultipleImages(metadata.inspection.photos);
      processedMetadata = {
        ...metadata,
        inspection: {
          ...metadata.inspection,
          photos: savedImagePaths
        }
      };
    }

    // Vérifier aussi dans inspectionData (nouvelle structure)
    if (metadata?.inspectionData?.photos) {
      const savedImagePaths = await imageService.saveMultipleImages(metadata.inspectionData.photos);
      processedMetadata = {
        ...metadata,
        inspectionData: {
          ...metadata.inspectionData,
          photos: savedImagePaths
        }
      };
    }

    const request = await prisma.lockRequest.create({
      data: {
        userId,
        bikeId,
        rideId,
        latitude: location?.lat,
        longitude: location?.lng,
        status: RequestStatus.PENDING,
        metadata: processedMetadata || {}
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        bike: { select: { code: true, model: true } }
      }
    });

    const responseMetadata = this.prepareMetadataForResponse(request.metadata, req);

    const response = {
      ...request,
      metadata: responseMetadata
    };

    // Notifier les admins
    await this.notifyAdmins('lock', request);

    return response;
  }

  /**
   * Supprimer une demande
   */
  async deleteRequest(type: 'unlock' | 'lock', requestId: string): Promise<void> {
    let request;
    
    if (type === 'unlock') {
      request = await prisma.unlockRequest.findUnique({
        where: { id: requestId }
      });
    } else {
      request = await prisma.lockRequest.findUnique({
        where: { id: requestId }
      });
    }

    if (!request) {
      throw new Error('Demande non trouvée');
    }

    // Supprimer les images associées
    const metadata = request.metadata as any;
    if (metadata?.inspectionData?.photos) {
      await imageService.deleteMultipleImages(metadata.inspectionData.photos);
    }

    // Supprimer la demande
    if (type === 'unlock') {
      await prisma.unlockRequest.delete({ where: { id: requestId } });
    } else {
      await prisma.lockRequest.delete({ where: { id: requestId } });
    }
  }

  /**
   * Valider une demande de déverrouillage (admin)
   */
  async approveUnlockRequest(requestId: string, adminId: string): Promise<any> {
    const request = await prisma.unlockRequest.findUnique({
      where: { id: requestId },
      include: { bike: true, user: { include: { wallet: true } }, reservation: true }
    });

    if (!request || request.status !== RequestStatus.PENDING) {
      throw new Error('Demande non trouvée ou déjà traitée');
    }

    // Vérifier que le vélo est disponible
    if (request.bike.status !== BikeStatus.AVAILABLE && request.bike.status !== BikeStatus.IN_USE) {
      throw new Error('Le vélo n\'est pas disponible');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Valider la demande
      const updatedRequest = await tx.unlockRequest.update({
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
        data: { status: BikeStatus.IN_USE }
      });

      // Créer le trajet
      const ride = await tx.ride.create({
        data: {
          userId: request.userId,
          bikeId: request.bikeId,
          startTime: new Date(),
          startLatitude: request.bike.latitude || 0,
          startLongitude: request.bike.longitude || 0,
          status: 'IN_PROGRESS',
          planId: request.reservation?.planId || null
        }
      });

      // Si c'est lié à une réservation, mettre à jour son statut
      if (request.reservationId) {
        await tx.reservation.update({
          where: { id: request.reservationId },
          data: { status: 'IN_USE' }
        });
      }

      return { request: updatedRequest, ride };
    });

    // Notifier l'utilisateur
    await this.notificationService.createNotification({
      userId: request.userId,
      title: 'Déverrouillage validé - Trajet démarré',
      message: `Votre demande de déverrouillage du vélo ${request.bike.code} a été approuvée. Votre trajet a commencé !`,
      type: 'UNLOCK_APPROVED'
    });

    return result;
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
      include: { bike: true, user: { include: { wallet: true } }, ride: { include: { plan: { include: { overrides: true } } } } }
    });

    if (!request || request.status !== RequestStatus.PENDING) {
      throw new Error('Demande non trouvée ou déjà traitée');
    }

    const result = await prisma.$transaction(async (tx) => {
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
          status: BikeStatus.AVAILABLE,
          latitude: request.latitude,
          longitude: request.longitude
        }
      });

      let rideResult = null;
      let paymentResult = null;

      // Terminer le trajet si spécifié
      if (request.rideId && request.ride) {
        const ride = request.ride;

        if (ride.status === 'IN_PROGRESS') {
          const now = new Date();
          const duration = Math.floor((now.getTime() - ride.startTime.getTime()) / 1000 / 60);
          
          // Calculer le coût avec la logique avancée
          const costCalculation = await this.calculateAdvancedRideCost(
            request.userId,
            duration,
            ride.startTime,
            ride.plan
          );

          // Mettre à jour le trajet
          rideResult = await tx.ride.update({
            where: { id: request.rideId },
            data: {
              endTime: now,
              endLatitude: request.latitude,
              endLongitude: request.longitude,
              duration,
              cost: costCalculation.finalCost,
              status: 'COMPLETED'
            }
          });

          // Effectuer le paiement
          if (costCalculation.finalCost > 0 && request.user.wallet) {
            paymentResult = await this.processRidePayment(
              tx,
              request.userId,
              request.user.wallet.id,
              request.rideId,
              costCalculation,
              duration
            );
          }

          // Mettre à jour la réservation si elle existe
          const reservation = await tx.reservation.findFirst({
            where: {
              userId: request.userId,
              bikeId: request.bikeId,
              status: { in: ['ACTIVE', 'IN_USE'] }
            }
          });

          if (reservation) {
            await tx.reservation.update({
              where: { id: reservation.id },
              data: { status: 'COMPLETED' }
            });
          }
        }
      }

      return { request, ride: rideResult, payment: paymentResult };
    });

    // Notifier l'utilisateur
    const message = result.ride 
      ? `Votre trajet avec le vélo ${request.bike.code} est terminé. Durée: ${result.ride.duration} min, Coût: ${result.ride.cost} FCFA`
      : `Votre demande de verrouillage du vélo ${request.bike.code} a été approuvée`;

    await this.notificationService.createNotification({
      userId: request.userId,
      title: 'Trajet terminé',
      message,
      type: 'LOCK_APPROVED'
    });

    return result;
  }

  /**
   * Traiter le paiement du trajet
   */
  private async processRidePayment(
    tx: any,
    _userId: string,
    walletId: string,
    rideId: string,
    costCalculation: any,
    duration: number
  ) {
    const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new Error('Portefeuille non trouvé');

    const amount = costCalculation.finalCost;
    let deductedFromWallet = 0;
    let deductedFromDeposit = 0;

    if (wallet.balance >= amount) {
      // Tout depuis le wallet
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } }
      });
      deductedFromWallet = amount;
    } else {
      // Wallet + caution
      const remaining = amount - wallet.balance;
      deductedFromWallet = wallet.balance;
      deductedFromDeposit = Math.min(remaining, wallet.deposit);
      const addToNegative = Math.max(0, remaining - wallet.deposit);

      await tx.wallet.update({
        where: { id: walletId },
        data: { 
          balance: 0,
          deposit: { decrement: deductedFromDeposit },
          negativeBalance: { increment: addToNegative }
        }
      });
    }

    // Créer la transaction
    const transaction = await tx.transaction.create({
      data: {
        walletId,
        type: 'RIDE_PAYMENT',
        amount,
        fees: 0,
        totalAmount: amount,
        status: 'COMPLETED',
        paymentMethod: costCalculation.paymentMethod || 'MIXED',
        metadata: {
          rideId,
          originalCost: costCalculation.originalCost,
          discountApplied: costCalculation.discountApplied,
          isOvertime: costCalculation.isOvertime,
          hasActiveSubscription: costCalculation.hasActiveSubscription,
          appliedRule: costCalculation.appliedRule,
          duration,
          deductedFromWallet,
          deductedFromDeposit,
          paidAt: new Date().toISOString()
        }
      }
    });

    return transaction;
  }

  /**
   * Calculer le coût avec la logique avancée
   */
  private async calculateAdvancedRideCost(
    userId: string,
    duration: number,
    startTime: Date,
    ridePlan: any
  ) {
    const hourlyRate = ridePlan?.hourlyRate || 200;
    const durationHours = duration / 60;
    const roundedHours = Math.ceil(durationHours);
    const originalCost = roundedHours * hourlyRate;

    let finalCost = originalCost;
    let discountApplied = 0;
    let appliedRule = 'Tarif normal';
    let paymentMethod = 'WALLET';
    let isOvertime = false;
    let hasActiveSubscription = false;

    // Vérifier l'abonnement actif
    const activeSubscription = await this.getActiveSubscriptionForRide(userId);

    if (activeSubscription) {
      hasActiveSubscription = true;
      isOvertime = this.checkIfOvertime(startTime, activeSubscription.packageType);
      
      if (isOvertime) {
        const overrideRule = await this.getOverrideRule(activeSubscription.planId);
        
        if (overrideRule) {
          if (overrideRule.overTimeType === 'FIXED_PRICE') {
            finalCost = overrideRule.overTimeValue;
            appliedRule = `Prix fixe overtime: ${overrideRule.overTimeValue} FCFA`;
          } else if (overrideRule.overTimeType === 'PERCENTAGE_REDUCTION') {
            const reduction = Math.round(originalCost * (overrideRule.overTimeValue / 100));
            finalCost = Math.max(0, originalCost - reduction);
            discountApplied = reduction;
            appliedRule = `Réduction overtime: ${overrideRule.overTimeValue}%`;
          }
        } else {
          const reduction = Math.round(originalCost * 0.3);
          finalCost = originalCost - reduction;
          discountApplied = reduction;
          appliedRule = 'Réduction forfait overtime par défaut: 30%';
        }
        paymentMethod = 'SUBSCRIPTION_OVERTIME';
      } else {
        finalCost = 0;
        discountApplied = originalCost;
        appliedRule = `Inclus dans le forfait ${activeSubscription.planName}`;
        paymentMethod = 'SUBSCRIPTION';
      }
    }

    return {
      originalCost,
      finalCost,
      discountApplied,
      isOvertime,
      hasActiveSubscription,
      appliedRule,
      paymentMethod,
      roundedHours
    };
  }

  private checkIfOvertime(startTime: Date, packageType: string): boolean {
    const hour = startTime.getHours();
    
    switch (packageType.toLowerCase()) {
      case 'daily':
      case 'journalier':
        return hour < 8 || hour >= 19;
      case 'morning':
      case 'matin':
        return hour < 6 || hour >= 12;
      case 'evening':
      case 'soirée':
        return hour < 19 || hour >= 22;
      default:
        return false;
    }
  }

  private async getActiveSubscriptionForRide(userId: string) {
    const activeReservation = await prisma.reservation.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'IN_USE'] },
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: { plan: { include: { overrides: true } } }
    });

    if (activeReservation) {
      return {
        id: activeReservation.id,
        planId: activeReservation.planId,
        planName: activeReservation.plan.name,
        packageType: activeReservation.packageType,
        type: 'RESERVATION'
      };
    }

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
      return {
        id: activeSubscription.id,
        planId: activeSubscription.planId,
        planName: activeSubscription.plan.name,
        packageType: activeSubscription.type,
        type: 'SUBSCRIPTION'
      };
    }

    return null;
  }

  private async getOverrideRule(planId: string) {
    return await prisma.planOverride.findFirst({
      where: { planId }
    });
  }

  /**
   * Obtenir les URLs complètes des images d'une demande
   */
  async getRequestImages(requestId: string, type: 'unlock' | 'lock'): Promise<string[]> {
    let request;
    
    if (type === 'unlock') {
      request = await prisma.unlockRequest.findUnique({
        where: { id: requestId }
      });
    } else {
      request = await prisma.lockRequest.findUnique({
        where: { id: requestId }
      });
    }

    if (!request) {
      throw new Error('Demande non trouvée');
    }

    const metadata = request.metadata as any;
    const images: string[] = [];

    if (metadata?.inspectionData?.photos) {
      images.push(...metadata.inspectionData.photos);
    }

    if (metadata?.inspection?.photos) {
      images.push(...metadata.inspection.photos);
    }

    return imageService.getImageUrls(images.filter(img => img && img.trim() !== ''));
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
  async getPendingRequests(type: 'unlock' | 'lock', page: number = 1, limit: number = 20, req?: any) {
    const skip = (page - 1) * limit;

    if (type === 'unlock') {
      const [requests, total] = await Promise.all([
        prisma.unlockRequest.findMany({
          where: { status: RequestStatus.PENDING },
          include: {
            user: { select: { firstName: true, lastName: true } },
            bike: { select: { code: true, model: true, latitude: true, longitude: true } },
            reservation: { select: { id: true, startDate: true, endDate: true, status: true, packageType: true } }
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit
        }),
        prisma.unlockRequest.count({ where: { status: RequestStatus.PENDING } })
      ]);

      const processedRequests = requests.map(request => ({
        ...request,
        metadata: this.prepareMetadataForResponse(request.metadata, req)
      }));

      return { requests: processedRequests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } else {
      const [requests, total] = await Promise.all([
        prisma.lockRequest.findMany({
          where: { status: RequestStatus.PENDING },
          include: {
            user: { select: { firstName: true, lastName: true } },
            bike: { select: { code: true, model: true } },
            ride: { select: { id: true, startTime: true, endTime: true, cost: true, duration: true } }
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit
        }),
        prisma.lockRequest.count({ where: { status: RequestStatus.PENDING } })
      ]);

      const processedRequests = requests.map(request => ({
        ...request,
        metadata: this.prepareMetadataForResponse(request.metadata, req)
      }));

      return { requests: processedRequests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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

  /**
   * Préparer les métadonnées pour la réponse (convertir les chemins en URLs)
   */
  private prepareMetadataForResponse(metadata: any, req?: any): any {
    if (!metadata) return metadata;
    
    const result = { ...metadata };
    
    // Traiter inspection.photos
    if (result.inspection?.photos) {
      result.inspection.photos = imageService.getImageUrls(result.inspection.photos, req);
    }
    
    // Traiter inspectionData.photos
    if (result.inspectionData?.photos) {
      result.inspectionData.photos = imageService.getImageUrls(result.inspectionData.photos, req);
    }
    
    return result;
  }
}

export default new BikeRequestService();