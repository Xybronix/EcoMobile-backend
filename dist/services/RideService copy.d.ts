import { Ride } from '../models/types';
export declare class RideService {
    private rideRepository;
    private bikeRepository;
    private walletRepository;
    private transactionRepository;
    private notificationRepository;
    constructor();
    startRide(userId: string, bikeId: string, startLocation: any, language?: 'fr' | 'en'): Promise<Ride>;
    endRide(rideId: string, endLocation: any, language?: 'fr' | 'en'): Promise<Ride>;
    getUserRides(userId: string, page?: number, limit?: number): Promise<Ride[]>;
    getActiveRide(userId: string, _language?: 'fr' | 'en'): Promise<Ride | null>;
    private calculateDistance;
    private toRad;
}
//# sourceMappingURL=RideService%20copy.d.ts.map