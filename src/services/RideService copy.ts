import { RideRepository, BikeRepository, WalletRepository, TransactionRepository, NotificationRepository } from '../repositories';
import { Ride } from '../models/types';
import { AppError } from '../middleware/errorHandler';
import { t } from '../locales';

export class RideService {
  private rideRepository: RideRepository;
  private bikeRepository: BikeRepository;
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;
  private notificationRepository: NotificationRepository;

  constructor() {
    this.rideRepository = new RideRepository();
    this.bikeRepository = new BikeRepository();
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
    this.notificationRepository = new NotificationRepository();
  }

  async startRide(userId: string, bikeId: string, startLocation: any, language: 'fr' | 'en' = 'fr'): Promise<Ride> {
    // Check if user has active ride
    const activeRide = await this.rideRepository.findActiveRideByUserId(userId);
    if (activeRide) {
      throw new AppError(t('ride.already_in_progress', language), 400);
    }

    // Check if bike is available
    const bike = await this.bikeRepository.findById(bikeId);
    if (!bike) {
      throw new AppError(t('bike.not_found', language), 404);
    }

    if (bike.status !== 'available') {
      throw new AppError(t('bike.unavailable', language), 400);
    }

    // Check user wallet balance
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet || wallet.balance < 5) { // Minimum 5 units required
      throw new AppError(t('wallet.insufficient_balance', language), 400);
    }

    // Create ride
    const ride = await this.rideRepository.create({
      userId,
      bikeId,
      startTime: new Date(),
      startLocation,
      status: 'in_progress',
      paymentStatus: 'pending'
    });

    // Update bike status
    await this.bikeRepository.updateStatus(bikeId, 'in_use');

    // Send notification
    await this.notificationRepository.create({
      userId,
      type: 'success',
      category: 'ride',
      title: language === 'fr' ? 'Trajet commencé' : 'Ride started',
      message: language === 'fr' 
        ? `Votre trajet avec le vélo ${bike.bikeNumber} a commencé`
        : `Your ride with bike ${bike.bikeNumber} has started`,
      read: false
    });

    return ride;
  }

  async endRide(rideId: string, endLocation: any, language: 'fr' | 'en' = 'fr'): Promise<Ride> {
    // Find ride
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new AppError(t('ride.not_found', language), 404);
    }

    if (ride.status !== 'in_progress') {
      throw new AppError(t('ride.not_in_progress', language), 400);
    }

    // Calculate duration and cost
    const duration = Math.floor((new Date().getTime() - new Date(ride.startTime).getTime()) / 1000 / 60); // minutes
    const distance = this.calculateDistance(
      ride.startLocation.latitude,
      ride.startLocation.longitude,
      endLocation.latitude,
      endLocation.longitude
    );

    // Simple pricing: 0.5 per minute + 1 unlock fee
    const cost = Math.round((0.5 * duration + 1) * 100) / 100;

    // Update ride
    await this.rideRepository.completeRide(rideId, endLocation, distance, duration, cost);

    // Get wallet and process payment
    const wallet = await this.walletRepository.findByUserId(ride.userId);
    if (!wallet || wallet.balance < cost) {
      await this.rideRepository.updatePaymentStatus(rideId, 'failed');
      throw new AppError(t('wallet.insufficient_balance', language), 400);
    }

    // Deduct from wallet
    await this.walletRepository.updateBalance(wallet.id, -cost);

    // Create transaction
    await this.transactionRepository.create({
      userId: ride.userId,
      type: 'ride',
      amount: cost,
      currency: 'EUR',
      status: 'completed',
      description: language === 'fr' ? `Trajet ${rideId}` : `Ride ${rideId}`,
      rideId
    });

    // Update ride payment status
    await this.rideRepository.updatePaymentStatus(rideId, 'paid');

    // Update bike
    const bike = await this.bikeRepository.findById(ride.bikeId);
    if (bike) {
      await this.bikeRepository.updateStatus(ride.bikeId, 'available');
      await this.bikeRepository.updateLocation(ride.bikeId, endLocation.latitude, endLocation.longitude, endLocation.address);
      await this.bikeRepository.incrementRideStats(ride.bikeId, distance);
    }

    // Send notification
    await this.notificationRepository.create({
      userId: ride.userId,
      type: 'success',
      category: 'ride',
      title: language === 'fr' ? 'Trajet terminé' : 'Ride completed',
      message: language === 'fr'
        ? `Trajet terminé. Durée: ${duration} min. Coût: ${cost}€`
        : `Ride completed. Duration: ${duration} min. Cost: €${cost}`,
      read: false
    });

    return await this.rideRepository.findById(rideId) as Ride;
  }

  async getUserRides(userId: string, page: number = 1, limit: number = 10): Promise<Ride[]> {
    // return this.rideRepository.findAll({ where: { userId }, page, limit });
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    return this.rideRepository.findAll({ 
      where: { userId }, 
      page: pageNum, 
      limit: limitNum 
    });
  }

  async getActiveRide(userId: string, _language: 'fr' | 'en' = 'fr'): Promise<Ride | null> {
    return this.rideRepository.findActiveRideByUserId(userId);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
