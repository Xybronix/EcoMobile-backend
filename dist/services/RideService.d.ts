import { Ride } from '@prisma/client';
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
export declare class RideService {
    constructor();
    startRide(userId: string, bikeId: string, startLocation: any, language?: 'fr' | 'en'): Promise<Ride>;
    endRide(rideId: string, endLocation: any, language?: 'fr' | 'en'): Promise<RideWithDetails>;
    getUserRides(userId: string, page?: number, limit?: number): Promise<{
        rides: ({
            bike: {
                model: string;
                id: string;
                status: import(".prisma/client").$Enums.BikeStatus;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                batteryLevel: number;
                latitude: number | null;
                longitude: number | null;
                locationName: string | null;
                equipment: import("@prisma/client/runtime/library").JsonValue | null;
                lastMaintenanceAt: Date | null;
                qrCode: string;
                gpsDeviceId: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.RideStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            bikeId: string;
            startTime: Date;
            endTime: Date | null;
            startLatitude: number;
            startLongitude: number;
            endLatitude: number | null;
            endLongitude: number | null;
            distance: number | null;
            duration: number | null;
            cost: number | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getActiveRide(userId: string, _language?: 'fr' | 'en'): Promise<RideWithDetails | null>;
    getRideById(rideId: string): Promise<RideWithDetails | null>;
    cancelRide(rideId: string, userId: string, language?: 'fr' | 'en'): Promise<Ride>;
    getRideStats(userId: string): Promise<{
        totalRides: number;
        totalDistance: number;
        totalDuration: number;
        totalCost: number;
        averageDistance: number;
        averageDuration: number;
    }>;
}
declare const _default: RideService;
export default _default;
//# sourceMappingURL=RideService.d.ts.map