import { BikeStatus, Bike } from '@prisma/client';
export interface CreateBikeDto {
    code: string;
    model: string;
    status?: BikeStatus;
    batteryLevel?: number;
    latitude?: number;
    longitude?: number;
}
export interface UpdateBikeDto {
    code?: string;
    model?: string;
    status?: BikeStatus;
    batteryLevel?: number;
    latitude?: number;
    longitude?: number;
}
export interface BikeFilter {
    status?: BikeStatus;
    minBatteryLevel?: number;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
}
export declare class BikeService {
    /**
     * Create a new bike
     */
    createBike(data: CreateBikeDto): Promise<Bike>;
    /**
     * Get bike by ID
     */
    getBikeById(id: string): Promise<Bike | null>;
    /**
     * Get bike by code or QR code
     */
    getBikeByCode(code: string): Promise<Bike | null>;
    /**
     * Get all bikes with filters
     */
    getAllBikes(filter?: BikeFilter, page?: number, limit?: number): Promise<{
        bikes: {
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
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Get nearby bikes (within radius)
     */
    getNearbyBikes(latitude: number, longitude: number, radiusKm?: number): Promise<({
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
    } & {
        latitude: number;
        longitude: number;
    } & {
        distance: number;
    })[]>;
    /**
     * Update bike
     */
    updateBike(id: string, data: UpdateBikeDto): Promise<Bike>;
    /**
     * Update bike location
     */
    updateBikeLocation(id: string, latitude: number, longitude: number): Promise<Bike>;
    /**
     * Update bike status
     */
    updateBikeStatus(id: string, status: BikeStatus): Promise<Bike>;
    /**
     * Update bike battery
     */
    updateBikeBattery(id: string, batteryLevel: number): Promise<Bike>;
    /**
     * Delete bike
     */
    deleteBike(id: string): Promise<void>;
    /**
     * Lock bike (set to available)
     */
    lockBike(id: string): Promise<Bike>;
    /**
     * Unlock bike (set to in use)
     */
    unlockBike(id: string): Promise<Bike>;
    /**
     * Add maintenance log
     */
    addMaintenanceLog(bikeId: string, data: {
        type: string;
        description: string;
        cost?: number;
        performedBy?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        bikeId: string;
        cost: number | null;
        type: string;
        description: string;
        performedBy: string | null;
    }>;
    /**
     * Get maintenance history
     */
    getMaintenanceHistory(bikeId: string, page?: number, limit?: number): Promise<{
        logs: {
            id: string;
            createdAt: Date;
            bikeId: string;
            cost: number | null;
            type: string;
            description: string;
            performedBy: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Get bike statistics
     */
    getBikeStats(bikeId: string): Promise<{
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
        } | null;
        totalRides: number;
        totalDistance: number;
        totalRevenue: number;
    }>;
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    private toRad;
}
declare const _default: BikeService;
export default _default;
//# sourceMappingURL=BikeService%20copy.d.ts.map