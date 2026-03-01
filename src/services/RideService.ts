import { prisma } from '../config/prisma';
import { RideStatus, Ride } from '@prisma/client';
import BikeService from './BikeService';
import WalletService from './WalletService';
import FreeDaysRuleService from './FreeDaysRuleService';
import { AppError } from '../middleware/errorHandler';
import { t } from '../locales';

export interface CreateRideDto {
  userId: string;
  bikeId: string;
  startLatitude: number;
  startLongitude: number;
}

export interface EndRideDto {
  endLatitude: number;
  endLongitude: number;
}

export interface RideWithDetails extends Ride {
  bike?: any;
  user?: any;
  gpsTrack?: any[];
}

export class RideService {
  constructor() {}

  async startRide(userId: string, bikeId: string, startLocation: any, language: 'fr' | 'en' = 'fr'): Promise<Ride> {
    // Check if user has active ride
    const activeRide = await prisma.ride.findFirst({
      where: { 
        userId, 
        status: RideStatus.IN_PROGRESS 
      }
    });

    if (activeRide) {
      throw new AppError(t('ride.already_in_progress', language), 400);
    }

    // Check if bike is available and unlock it
    const bike = await BikeService.getBikeById(bikeId);
    if (!bike) {
      throw new AppError(t('bike.not_found', language), 404);
    }

    if (bike.status !== 'AVAILABLE') {
      throw new AppError(t('bike.unavailable', language), 400);
    }

    // Check user wallet balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user?.wallet || user.wallet.balance < 5) { // Minimum 5 units required
      throw new AppError(t('wallet.insufficient_balance', language), 400);
    }

    try {
      // Start transaction
      const ride = await prisma.$transaction(async (tx) => {
        // Create ride
        const newRide = await tx.ride.create({
          data: {
            userId,
            bikeId,
            startTime: new Date(),
            startLatitude: startLocation.latitude,
            startLongitude: startLocation.longitude,
            status: RideStatus.IN_PROGRESS
          }
        });

        // Unlock bike via BikeService (which handles GPS sync)
        await BikeService.unlockBike(bikeId);

        return newRide;
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'success',
          title: language === 'fr' ? 'Trajet commencé' : 'Ride started',
          message: language === 'fr' 
            ? `Votre trajet avec le vélo ${bike.code} a commencé`
            : `Your ride with bike ${bike.code} has started`,
          isRead: false
        }
      });

      return ride;
    } catch (error) {
      console.error('Error starting ride:', error);
      throw new AppError(t('error.ride.start_failed', language), 500);
    }
  }

  /**
   * Terminer un trajet avec la logique de pricing avancée
   */
  async endRide(rideId: string, endLocation: any, language: 'fr' | 'en' = 'fr'): Promise<any> {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        bike: { include: { pricingPlan: { include: { overrides: true } } } },
        user: { include: { wallet: true } },
        plan: { include: { overrides: true } }
      }
    });

    if (!ride) {
      throw new AppError(t('ride.not_found', language), 404);
    }

    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new AppError(t('ride.not_in_progress', language), 400);
    }

    // Calculer la durée
    const duration = Math.floor((new Date().getTime() - new Date(ride.startTime).getTime()) / 1000 / 60);
    
    // Calculer la distance
    let distance = BikeService.calculateDistance(
      ride.startLatitude,
      ride.startLongitude,
      endLocation.latitude,
      endLocation.longitude
    );

    // Obtenir la piste GPS pour une distance plus précise
    try {
      const gpsTrack = await BikeService.getBikeTrack(ride.bikeId, ride.startTime, new Date());
      if (gpsTrack.length > 1) {
        let totalDistance = 0;
        for (let i = 1; i < gpsTrack.length; i++) {
          totalDistance += BikeService.calculateDistance(
            gpsTrack[i-1].latitude,
            gpsTrack[i-1].longitude,
            gpsTrack[i].latitude,
            gpsTrack[i].longitude
          );
        }
        if (totalDistance > distance && totalDistance < distance * 3) {
          distance = totalDistance;
        }
      }
    } catch (error) {
      console.warn('Failed to get GPS track:', error);
    }

    // Vérifier l'abonnement actif
    const activeSubscription = await this.getActiveSubscriptionForRide(ride.userId);
    
    // Utiliser le plan du vélo si le plan de la course n'est pas défini
    const ridePlan = ride.plan || ride.bike?.pricingPlan;
    
    // Calculer le coût avec la logique avancée
    const costCalculation = await this.calculateAdvancedRideCost(
      ride.userId,
      duration,
      ride.startTime,
      activeSubscription,
      ridePlan
    );

    // Consommer un jour gratuit si l'utilisateur n'a pas de forfait et que le trajet est payant
    if (costCalculation.finalCost > 0 && costCalculation.paymentMethod === 'WALLET') {
      const usedFreeDay = await FreeDaysRuleService.useFreeDay(ride.userId);
      if (usedFreeDay) {
        costCalculation.finalCost = 0;
        costCalculation.discountApplied = costCalculation.originalCost;
        costCalculation.appliedRule = 'Jour gratuit utilisé';
        costCalculation.paymentMethod = 'FREE_DAY';
      }
    }

    // Vérifier la capacité de paiement
    await this.validatePaymentCapacity(ride.user, costCalculation.finalCost);

    try {
      const updatedRide = await prisma.$transaction(async (tx) => {
        // Mettre à jour le trajet
        const completedRide = await tx.ride.update({
          where: { id: rideId },
          data: {
            endTime: new Date(),
            endLatitude: endLocation.latitude,
            endLongitude: endLocation.longitude,
            distance: Math.round(distance * 100) / 100,
            duration,
            cost: costCalculation.finalCost,
            status: RideStatus.COMPLETED
          },
          include: {
            bike: true,
            user: { include: { wallet: true } }
          }
        });

        // Traiter le paiement avec la logique avancée
        if (costCalculation.finalCost > 0) {
          await WalletService.processRidePayment(
            ride.userId,
            rideId,
            costCalculation.finalCost,
            !!activeSubscription,
            costCalculation.isOvertime,
            ride.startTime
          );
        }

        // Créer une transaction avec détails
        await tx.transaction.create({
          data: {
            walletId: ride.user.wallet!.id,
            type: 'RIDE_PAYMENT',
            amount: costCalculation.finalCost,
            fees: 0,
            totalAmount: costCalculation.finalCost,
            status: 'COMPLETED',
            paymentMethod: costCalculation.paymentMethod,
            metadata: {
              rideId,
              originalCost: costCalculation.originalCost,
              discountApplied: costCalculation.discountApplied,
              isOvertime: costCalculation.isOvertime,
              hasActiveSubscription: !!activeSubscription,
              subscriptionType: activeSubscription?.packageType,
              appliedRule: costCalculation.appliedRule,
              duration,
              distance
            }
          }
        });

        return completedRide;
      });

      // Verrouiller le vélo et mettre à jour sa position
      await BikeService.lockBike(ride.bikeId);
      await BikeService.updateBikeLocation(ride.bikeId, endLocation.latitude, endLocation.longitude);

      // Notification avec détails du pricing
      const notificationMessage = costCalculation.finalCost === 0
        ? `Trajet terminé (${duration} min, ${distance.toFixed(2)} km). Inclus dans votre forfait ${activeSubscription?.planName}!`
        : costCalculation.discountApplied > 0
        ? `Trajet terminé (${duration} min, ${distance.toFixed(2)} km). Coût: ${costCalculation.finalCost} XAF (économie: ${costCalculation.discountApplied} XAF)`
        : `Trajet terminé (${duration} min, ${distance.toFixed(2)} km). Coût: ${costCalculation.finalCost} XAF`;

      await prisma.notification.create({
        data: {
          userId: ride.userId,
          type: 'success',
          title: language === 'fr' ? 'Trajet terminé' : 'Ride completed',
          message: notificationMessage,
          isRead: false
        }
      });

      return { ...updatedRide, costDetails: costCalculation };
    } catch (error) {
      console.error('Error ending ride:', error);
      throw new AppError(t('error.ride.end_failed', language), 500);
    }
  }

  async getUserRides(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: { userId },
        include: {
          bike: true
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit
      }),
      prisma.ride.count({ where: { userId } })
    ]);

    return {
      rides,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getActiveRide(userId: string, _language: 'fr' | 'en' = 'fr'): Promise<RideWithDetails | null> {
    const ride = await prisma.ride.findFirst({
      where: { 
        userId, 
        status: RideStatus.IN_PROGRESS 
      },
      include: {
        bike: true,
        user: true
      }
    });

    if (!ride) return null;

    // Get real-time bike location if available
    if (ride.bike?.code) {
      try {
        const updatedBike = await BikeService.getBikeById(ride.bikeId);
        if (updatedBike) {
          ride.bike = updatedBike;
        }
      } catch (error) {
        console.warn('Failed to get updated bike location:', error);
      }
    }

    return ride;
  }

  async getRideById(rideId: string): Promise<RideWithDetails | null> {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        bike: true,
        user: true
      }
    });

    if (!ride) return null;

    // Get GPS track if ride is completed
    if (ride.status === RideStatus.COMPLETED && ride.endTime) {
      try {
        const gpsTrack = await BikeService.getBikeTrack(
          ride.bikeId,
          ride.startTime,
          ride.endTime
        );
        return { ...ride, gpsTrack };
      } catch (error) {
        console.warn('Failed to get GPS track for completed ride:', error);
      }
    }

    return ride;
  }

  async cancelRide(rideId: string, userId: string, language: 'fr' | 'en' = 'fr'): Promise<Ride> {
    const ride = await prisma.ride.findFirst({
      where: { 
        id: rideId,
        userId,
        status: RideStatus.IN_PROGRESS 
      },
      include: { bike: true }
    });

    if (!ride) {
      throw new AppError(t('ride.not_found', language), 404);
    }

    try {
      const cancelledRide = await prisma.$transaction(async (tx) => {
        // Update ride status
        const updatedRide = await tx.ride.update({
          where: { id: rideId },
          data: {
            status: RideStatus.CANCELLED,
            endTime: new Date()
          }
        });

        return updatedRide;
      });

      // Lock bike and sync location
      try {
        await BikeService.lockBike(ride.bikeId);
      } catch (error) {
        console.error('Failed to lock bike after cancellation:', error);
      }

      // Send notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'info',
          title: language === 'fr' ? 'Trajet annulé' : 'Ride cancelled',
          message: language === 'fr'
            ? `Votre trajet avec le vélo ${ride.bike?.code} a été annulé`
            : `Your ride with bike ${ride.bike?.code} has been cancelled`,
          isRead: false
        }
      });

      return cancelledRide;
    } catch (error) {
      console.error('Error cancelling ride:', error);
      throw new AppError(t('error.ride.cancel_failed', language), 500);
    }
  }

  async getRideStats(userId: string): Promise<{
    totalRides: number;
    totalDistance: number;
    totalDuration: number;
    totalCost: number;
    averageDistance: number;
    averageDuration: number;
  }> {
    const stats = await prisma.ride.aggregate({
      where: {
        userId,
        status: RideStatus.COMPLETED
      },
      _count: { id: true },
      _sum: {
        distance: true,
        duration: true,
        cost: true
      }
    });

    const totalRides = stats._count.id || 0;
    const totalDistance = stats._sum.distance || 0;
    const totalDuration = stats._sum.duration || 0;
    const totalCost = stats._sum.cost || 0;

    return {
      totalRides,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration,
      totalCost: Math.round(totalCost * 100) / 100,
      averageDistance: totalRides > 0 ? Math.round((totalDistance / totalRides) * 100) / 100 : 0,
      averageDuration: totalRides > 0 ? Math.round(totalDuration / totalRides) : 0
    };
  }

  /**
   * Calculer le coût avec la logique avancée (forfaits, overtime, réductions)
   */
  private async calculateAdvancedRideCost(
    _userId: string,
    duration: number,
    startTime: Date,
    activeSubscription: any,
    ridePlan: any
  ) {
    let hourlyRate = ridePlan?.hourlyRate;
    if (!hourlyRate) {
      const pricingConfig = await prisma.pricingConfig.findFirst({ where: { isActive: true } });
      hourlyRate = pricingConfig?.baseHourlyRate || 200;
    }
    // Appliquer le multiplicateur de règle tarifaire (PricingRule) selon le jour/heure du trajet
    const rideDay = startTime.getDay();
    const rideHour = startTime.getHours();
    const applicableRule = await prisma.pricingRule.findFirst({
      where: {
        isActive: true,
        OR: [{ dayOfWeek: null }, { dayOfWeek: rideDay }],
        AND: [
          { OR: [{ startHour: null }, { startHour: { lte: rideHour } }] },
          { OR: [{ endHour: null }, { endHour: { gt: rideHour } }] }
        ]
      },
      orderBy: { priority: 'desc' }
    });
    if (applicableRule && applicableRule.multiplier !== 1) {
      hourlyRate = Math.round(hourlyRate * applicableRule.multiplier);
    }
    const durationHours = duration / 60;
    const roundedHours = Math.ceil(durationHours);
    const originalCost = roundedHours * hourlyRate;

    let finalCost = originalCost;
    let discountApplied = 0;
    let appliedRule = 'Tarif normal';
    let paymentMethod = 'WALLET';
    let isOvertime = false;

    if (activeSubscription) {
      // L'utilisateur a un forfait actif
      isOvertime = await this.checkIfOvertime(startTime, activeSubscription.packageType, activeSubscription.planId);
      
      if (isOvertime) {
        // Hors des heures du forfait - appliquer les règles d'override
        const overrideRule = await this.getOverrideRule(activeSubscription.planId);
        
        if (overrideRule) {
          if (overrideRule.overTimeType === 'FIXED_PRICE') {
            finalCost = overrideRule.overTimeValue;
            appliedRule = `Prix fixe overtime forfait: ${overrideRule.overTimeValue} XOF`;
          } else if (overrideRule.overTimeType === 'PERCENTAGE_REDUCTION') {
            const reduction = Math.round(originalCost * (overrideRule.overTimeValue / 100));
            finalCost = Math.max(0, originalCost - reduction);
            discountApplied = reduction;
            appliedRule = `Réduction overtime forfait: ${overrideRule.overTimeValue}%`;
          }
        } else {
          // Pas de règle d'override - réduction par défaut de 30%
          const reduction = Math.round(originalCost * 0.3);
          finalCost = originalCost - reduction;
          discountApplied = reduction;
          appliedRule = 'Réduction forfait overtime par défaut: 30%';
        }
        paymentMethod = 'SUBSCRIPTION_OVERTIME';
      } else {
        // Dans les heures du forfait - gratuit
        finalCost = 0;
        discountApplied = originalCost;
        appliedRule = `Inclus dans le forfait ${activeSubscription.planName}`;
        paymentMethod = 'SUBSCRIPTION';
      }
    }
    // Sinon pas de forfait = prix normal

    return {
      originalCost,
      finalCost,
      discountApplied,
      isOvertime,
      appliedRule,
      paymentMethod,
      hasActiveSubscription: !!activeSubscription,
      roundedHours,
      extraHours: activeSubscription ? Math.max(0, roundedHours - 1) : roundedHours
    };
  }

  /**
   * Vérifier si on est en overtime selon le type de forfait
   */
  private async checkIfOvertime(startTime: Date, packageType: string, planId?: string): Promise<boolean> {
    const hour = startTime.getHours();
    
    // Si un planId est fourni, vérifier les plages horaires définies dans PlanOverride
    if (planId) {
      const override = await this.getOverrideRule(planId);
      if (override) {
        const packageTypeLower = packageType.toLowerCase();
        let startHour: number | null = null;
        let endHour: number | null = null;
        
        switch (packageTypeLower) {
          case 'hourly':
          case 'horaire':
            startHour = override.hourlyStartHour;
            endHour = override.hourlyEndHour;
            break;
          case 'daily':
          case 'journalier':
            startHour = override.dailyStartHour;
            endHour = override.dailyEndHour;
            break;
          case 'weekly':
          case 'hebdomadaire':
            startHour = override.weeklyStartHour;
            endHour = override.weeklyEndHour;
            break;
          case 'monthly':
          case 'mensuel':
            startHour = override.monthlyStartHour;
            endHour = override.monthlyEndHour;
            break;
        }
        
        // Si des plages horaires sont définies, les utiliser
        if (startHour !== null && endHour !== null) {
          if (startHour <= endHour) {
            // Plage normale (ex: 8h-19h)
            return hour < startHour || hour >= endHour;
          } else {
            // Plage qui traverse minuit (ex: 22h-6h)
            return hour < startHour && hour >= endHour;
          }
        }
      }
    }
    
    // Fallback sur les valeurs par défaut
    switch (packageType.toLowerCase()) {
      case 'daily':
      case 'journalier':
        return hour < 8 || hour >= 19; // 8h-19h
      case 'hourly':
      case 'horaire':
        return hour < 8 || hour >= 19;
      case 'weekly':
      case 'hebdomadaire':
        return hour < 8 || hour >= 19;
      case 'monthly':
      case 'mensuel':
        return hour < 8 || hour >= 19;
      case 'morning':
      case 'matin':
        return hour < 6 || hour >= 12; // 6h-12h
      case 'evening':
      case 'soirée':
        return hour < 19 || hour >= 22; // 19h-22h
      case 'weekly':
      case 'monthly':
        return false; // Pas d'overtime pour ces forfaits
      default:
        return false;
    }
  }

  /**
   * Obtenir l'abonnement actif pour un trajet
   */
  private async getActiveSubscriptionForRide(userId: string) {
    // Vérifier d'abord les réservations (priorité)
    const activeReservation = await prisma.reservation.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: { plan: { include: { overrides: true } } }
    });

    if (activeReservation) {
      return {
        id: activeReservation.id,
        planId: activeReservation.planId,
        planName: activeReservation.plan?.name || 'Unknown',
        packageType: activeReservation.packageType,
        type: 'RESERVATION'
      };
    }

    // Sinon vérifier les abonnements généraux
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
        planName: activeSubscription.plan?.name || 'Unknown',
        packageType: activeSubscription.type,
        type: 'SUBSCRIPTION'
      };
    }

    return null;
  }

  /**
   * Obtenir la règle d'override pour un plan
   */
  private async getOverrideRule(planId: string) {
    return await prisma.planOverride.findFirst({
      where: { planId }
    });
  }

  /**
   * Valider la capacité de paiement
   */
  private async validatePaymentCapacity(user: any, amount: number) {
    if (amount === 0) return; // Rien à payer

    const totalAvailable = user.wallet.balance + user.depositBalance;
    
    if (totalAvailable < amount) {
      throw new AppError(
        `Solde insuffisant. Requis: ${amount} XOF, Disponible: ${totalAvailable} XOF (Wallet: ${user.wallet.balance}, Caution: ${user.depositBalance})`,
        400
      );
    }
  }
}

export default new RideService();