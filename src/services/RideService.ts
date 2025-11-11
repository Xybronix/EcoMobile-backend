// services/RideService.ts
import { prisma } from '../config/prisma';
import { RideStatus, Ride } from '@prisma/client';
import BikeService from './BikeService';
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
      throw new AppError('Failed to start ride', 500);
    }
  }

  async endRide(rideId: string, endLocation: any, language: 'fr' | 'en' = 'fr'): Promise<RideWithDetails> {
    // Find ride
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        bike: true,
        user: { include: { wallet: true } }
      }
    });

    if (!ride) {
      throw new AppError(t('ride.not_found', language), 404);
    }

    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new AppError(t('ride.not_in_progress', language), 400);
    }

    // Calculate duration in minutes
    const duration = Math.floor((new Date().getTime() - new Date(ride.startTime).getTime()) / 1000 / 60);
    
    // Calculate distance using BikeService method
    let distance = BikeService.calculateDistance(
      ride.startLatitude,
      ride.startLongitude,
      endLocation.latitude,
      endLocation.longitude
    );

    // Get GPS track for the ride period
    let gpsTrack: any[] = [];
    try {
      if (ride.bike?.code) {
        gpsTrack = await BikeService.getBikeTrack(
          ride.bikeId,
          ride.startTime,
          new Date()
        );
        
        // Calculate more accurate distance from GPS track if available
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
          // Use GPS distance if it's reasonable (not too different from straight line)
          if (totalDistance > distance && totalDistance < distance * 3) {
            distance = totalDistance;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get GPS track for ride:', error);
    }

    // Simple pricing: 0.5 per minute + 1 unlock fee
    const cost = Math.round((0.5 * duration + 1) * 100) / 100;

    // Check wallet balance
    if (!ride.user.wallet || ride.user.wallet.balance < cost) {
      throw new AppError(t('wallet.insufficient_balance', language), 400);
    }

    try {
      // Complete ride in transaction
      const updatedRide = await prisma.$transaction(async (tx) => {
        // Update ride
        const completedRide = await tx.ride.update({
          where: { id: rideId },
          data: {
            endTime: new Date(),
            endLatitude: endLocation.latitude,
            endLongitude: endLocation.longitude,
            distance: Math.round(distance * 100) / 100,
            duration,
            cost,
            status: RideStatus.COMPLETED
          },
          include: {
            bike: true,
            user: { include: { wallet: true } }
          }
        });

        // Deduct from wallet
        await tx.wallet.update({
          where: { id: ride.user.wallet!.id },
          data: {
            balance: { decrement: cost }
          }
        });

        // Create transaction
        await tx.transaction.create({
          data: {
            walletId: ride.user.wallet!.id,
            type: 'RIDE_PAYMENT',
            amount: cost,
            fees: 0,
            totalAmount: cost,
            status: 'COMPLETED',
            paymentMethod: 'wallet',
            metadata: {
              rideId: rideId,
              bikeCode: ride.bike?.code,
              duration: duration,
              distance: distance
            }
          }
        });

        return completedRide;
      });

      // Lock bike and update its location via BikeService (handles GPS sync)
      try {
        await BikeService.lockBike(ride.bikeId);
        await BikeService.updateBikeLocation(
          ride.bikeId, 
          endLocation.latitude, 
          endLocation.longitude
        );
      } catch (error) {
        console.error('Failed to lock bike or update location:', error);
      }

      // Send notification
      await prisma.notification.create({
        data: {
          userId: ride.userId,
          type: 'success',
          title: language === 'fr' ? 'Trajet terminé' : 'Ride completed',
          message: language === 'fr'
            ? `Trajet terminé. Durée: ${duration} min. Coût: ${cost} XAF`
            : `Ride completed. Duration: ${duration} min. Cost: ${cost} XAF`,
          isRead: false
        }
      });

      return {
        ...updatedRide,
        gpsTrack
      };
    } catch (error) {
      console.error('Error ending ride:', error);
      throw new AppError('Failed to end ride', 500);
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
      throw new AppError('Failed to cancel ride', 500);
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
}

export default new RideService();