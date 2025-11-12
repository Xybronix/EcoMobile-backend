import { BaseRepository } from './BaseRepository';
import { Bike } from '../models/types';
export declare class BikeRepository extends BaseRepository<Bike> {
    constructor();
    findByStatus(status: string): Promise<Bike[]>;
    findAvailableBikes(): Promise<Bike[]>;
    findByQRCode(qrCode: string): Promise<Bike | null>;
    findNearby(latitude: number, longitude: number, radiusKm?: number): Promise<Bike[]>;
    updateStatus(bikeId: string, status: Bike['status']): Promise<void>;
    updateLocation(bikeId: string, latitude: number, longitude: number, address?: string): Promise<void>;
    updateBatteryLevel(bikeId: string, batteryLevel: number): Promise<void>;
    incrementRideStats(bikeId: string, distance: number): Promise<void>;
    private calculateDistance;
    private toRad;
}
//# sourceMappingURL=BikeRepository.d.ts.map