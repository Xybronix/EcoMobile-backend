import { BaseRepository } from './BaseRepository';
import { Ride } from '../models/types';
export declare class RideRepository extends BaseRepository<Ride> {
    constructor();
    findByUserId(userId: string): Promise<Ride[]>;
    findActiveRideByUserId(userId: string): Promise<Ride | null>;
    findByBikeId(bikeId: string): Promise<Ride[]>;
    findByStatus(status: Ride['status']): Promise<Ride[]>;
    findActive(): Promise<Ride[]>;
    completeRide(rideId: string, endLocation: any, distance: number, duration: number, cost: number): Promise<void>;
    updatePaymentStatus(rideId: string, paymentStatus: Ride['paymentStatus']): Promise<void>;
    getUserRideStats(userId: string): Promise<{
        totalRides: number;
        totalDistance: number;
        totalCost: number;
    }>;
}
//# sourceMappingURL=RideRepository.d.ts.map