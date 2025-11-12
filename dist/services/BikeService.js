"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BikeService = void 0;
// services/BikeService.ts
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const GpsService_1 = __importDefault(require("./GpsService"));
const GooglePlacesService_1 = __importDefault(require("./GooglePlacesService"));
class BikeService {
    constructor() {
        // Configuration GPS à récupérer depuis les variables d'environnement
        this.gpsService = new GpsService_1.default({
            baseUrl: process.env.GPS_API_URL || 'http://www.gpspos.net/Interface',
            username: process.env.GPS_USERNAME || '',
            password: process.env.GPS_PASSWORD || ''
        });
        this.placesService = new GooglePlacesService_1.default(process.env.GOOGLE_PLACES_API_KEY || '');
    }
    /**
     * Create a new bike
     */
    async createBike(data) {
        // Generate QR code
        const qrCode = `ECOMOBILE-${data.code}-${(0, uuid_1.v4)()}`;
        const bike = await prisma_1.prisma.bike.create({
            data: {
                ...data,
                qrCode,
                status: data.status || client_1.BikeStatus.AVAILABLE,
                batteryLevel: data.batteryLevel || 100
            }
        });
        return bike;
    }
    /**
     * Get bike by ID
     */
    async getBikeById(id) {
        const bike = await prisma_1.prisma.bike.findUnique({
            where: { id },
            include: {
                maintenanceLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
        if (bike) {
            // Synchroniser avec les données GPS si le vélo a un code GPS
            return await this.syncBikeWithGps(bike);
        }
        return bike;
    }
    /**
     * Get bike by code or QR code
     */
    async getBikeByCode(code) {
        const bike = await prisma_1.prisma.bike.findFirst({
            where: {
                OR: [
                    { code },
                    { qrCode: code }
                ]
            }
        });
        if (bike) {
            // Synchroniser avec les données GPS
            return await this.syncBikeWithGps(bike);
        }
        return bike;
    }
    /**
     * Get all bikes with filters
     */
    async getAllBikes(filter, page = 1, limit = 20) {
        const where = {};
        if (filter?.status) {
            where.status = filter.status;
        }
        if (filter?.minBatteryLevel !== undefined) {
            where.batteryLevel = { gte: filter.minBatteryLevel };
        }
        const skip = (page - 1) * limit;
        try {
            const [bikes, total] = await Promise.all([
                prisma_1.prisma.bike.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma_1.prisma.bike.count({ where })
            ]);
            // Synchroniser tous les vélos avec les données GPS
            const syncedBikes = await this.syncBikesWithGps(bikes);
            // Si on a des coordonnées de référence, calculer les distances
            let bikesWithDistance = syncedBikes.map(bike => ({ ...bike, distance: null }));
            if (filter?.latitude && filter?.longitude) {
                bikesWithDistance = syncedBikes.map(bike => ({
                    ...bike,
                    distance: bike.latitude && bike.longitude
                        ? this.calculateDistance(filter.latitude, filter.longitude, bike.latitude, bike.longitude)
                        : null
                }));
                // Filtrer par rayon si spécifié
                if (filter.radiusKm) {
                    bikesWithDistance = bikesWithDistance.filter(bike => bike.distance != null && bike.distance <= filter.radiusKm);
                }
                // Trier par distance
                bikesWithDistance.sort((a, b) => {
                    const da = a.distance ?? Number.POSITIVE_INFINITY;
                    const db = b.distance ?? Number.POSITIVE_INFINITY;
                    if (da === db)
                        return 0;
                    return da - db;
                });
            }
            return {
                bikes: bikesWithDistance,
                pagination: {
                    page: page,
                    limit: limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            console.error('BikeService.getAllBikes error:', error);
            throw error;
        }
    }
    /**
     * Get nearby bikes (within radius)
     */
    async getNearbyBikes(latitude, longitude, radiusKm = 2) {
        // Get all available bikes with coordinates
        const bikes = await prisma_1.prisma.bike.findMany({
            where: {
                status: client_1.BikeStatus.AVAILABLE,
                latitude: { not: undefined },
                longitude: { not: undefined }
            }
        });
        // Synchroniser avec les données GPS
        const syncedBikes = await this.syncBikesWithGps(bikes);
        // Filter bikes within radius using Haversine formula
        const nearbyBikes = syncedBikes.filter((bike) => {
            return bike.latitude !== null &&
                bike.longitude !== null &&
                this.calculateDistance(latitude, longitude, bike.latitude, bike.longitude) <= radiusKm;
        });
        // Sort by distance
        nearbyBikes.sort((a, b) => {
            const distA = this.calculateDistance(latitude, longitude, a.latitude, a.longitude);
            const distB = this.calculateDistance(latitude, longitude, b.latitude, b.longitude);
            return distA - distB;
        });
        return nearbyBikes.map((bike) => ({
            ...bike,
            distance: this.calculateDistance(latitude, longitude, bike.latitude, bike.longitude)
        }));
    }
    /**
     * Update bike
     */
    async updateBike(id, data) {
        return await prisma_1.prisma.bike.update({
            where: { id },
            data
        });
    }
    /**
     * Update bike location
     */
    async updateBikeLocation(id, latitude, longitude) {
        return await prisma_1.prisma.bike.update({
            where: { id },
            data: { latitude, longitude }
        });
    }
    /**
     * Update bike status
     */
    async updateBikeStatus(id, status) {
        return await prisma_1.prisma.bike.update({
            where: { id },
            data: { status }
        });
    }
    /**
     * Update bike battery
     */
    async updateBikeBattery(id, batteryLevel) {
        return await prisma_1.prisma.bike.update({
            where: { id },
            data: { batteryLevel }
        });
    }
    /**
     * Delete bike
     */
    async deleteBike(id) {
        await prisma_1.prisma.bike.delete({
            where: { id }
        });
    }
    /**
     * Lock bike (set to available)
     */
    async lockBike(id) {
        const bike = await this.getBikeById(id);
        if (!bike) {
            throw new Error('Bike not found');
        }
        // Mettre à jour la position finale via GPS si le vélo a un code GPS
        if (bike.code) {
            try {
                const lastPosition = await this.gpsService.getLastPosition(bike.code);
                if (lastPosition) {
                    await this.updateBikeLocation(id, lastPosition.dbLat, lastPosition.dbLon);
                    await this.updateBikeBattery(id, this.gpsService.parseBatteryLevel(lastPosition.nFuel));
                }
            }
            catch (error) {
                console.warn(`Failed to update GPS data for bike ${id}:`, error);
            }
        }
        return await this.updateBikeStatus(id, client_1.BikeStatus.AVAILABLE);
    }
    /**
     * Unlock bike (set to in use)
     */
    async unlockBike(id) {
        const bike = await this.getBikeById(id);
        if (!bike) {
            throw new Error('Bike not found');
        }
        if (bike.status !== client_1.BikeStatus.AVAILABLE) {
            throw new Error('Bike is not available');
        }
        // Synchroniser avec GPS avant de déverrouiller
        if (bike.code) {
            try {
                const lastPosition = await this.gpsService.getLastPosition(bike.code);
                if (lastPosition) {
                    await this.updateBikeLocation(id, lastPosition.dbLat, lastPosition.dbLon);
                    await this.updateBikeBattery(id, this.gpsService.parseBatteryLevel(lastPosition.nFuel));
                }
            }
            catch (error) {
                console.warn(`Failed to sync GPS data for bike ${id}:`, error);
            }
        }
        return await this.updateBikeStatus(id, client_1.BikeStatus.IN_USE);
    }
    /**
     * Add maintenance log
     */
    async addMaintenanceLog(bikeId, data) {
        return await prisma_1.prisma.maintenanceLog.create({
            data: {
                bikeId,
                ...data
            }
        });
    }
    /**
     * Get maintenance history
     */
    async getMaintenanceHistory(bikeId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            prisma_1.prisma.maintenanceLog.findMany({
                where: { bikeId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.prisma.maintenanceLog.count({
                where: { bikeId }
            })
        ]);
        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Get bike statistics
     */
    async getBikeStats(bikeId) {
        const [bike, ridesCount, totalDistance, totalRevenue] = await Promise.all([
            prisma_1.prisma.bike.findUnique({ where: { id: bikeId } }),
            prisma_1.prisma.ride.count({
                where: { bikeId, status: 'COMPLETED' }
            }),
            prisma_1.prisma.ride.aggregate({
                where: { bikeId, status: 'COMPLETED' },
                _sum: { distance: true }
            }),
            prisma_1.prisma.ride.aggregate({
                where: { bikeId, status: 'COMPLETED' },
                _sum: { cost: true }
            })
        ]);
        return {
            bike,
            totalRides: ridesCount,
            totalDistance: totalDistance._sum.distance || 0,
            totalRevenue: totalRevenue._sum.cost || 0
        };
    }
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    // ========== NOUVELLES MÉTHODES GPS ET GOOGLE PLACES ==========
    /**
     * Synchroniser un vélo avec les données GPS
     */
    async syncBikeWithGps(bike) {
        if (!bike.code)
            return bike;
        try {
            const lastPosition = await this.gpsService.getLastPosition(bike.code);
            if (lastPosition) {
                const newBatteryLevel = this.gpsService.parseBatteryLevel(lastPosition.nFuel);
                const needsUpdate = bike.latitude !== lastPosition.dbLat ||
                    bike.longitude !== lastPosition.dbLon ||
                    bike.batteryLevel !== newBatteryLevel;
                if (needsUpdate) {
                    const updatedBike = await prisma_1.prisma.bike.update({
                        where: { id: bike.id },
                        data: {
                            latitude: lastPosition.dbLat,
                            longitude: lastPosition.dbLon,
                            batteryLevel: newBatteryLevel,
                            updatedAt: new Date()
                        }
                    });
                    return updatedBike;
                }
            }
        }
        catch (error) {
            console.warn(`Failed to sync GPS data for bike ${bike.id}:`, error);
        }
        return bike;
    }
    /**
     * Synchroniser plusieurs vélos avec les données GPS
     */
    async syncBikesWithGps(bikes) {
        const syncedBikes = [];
        for (const bike of bikes) {
            const syncedBike = await this.syncBikeWithGps(bike);
            syncedBikes.push(syncedBike);
        }
        return syncedBikes;
    }
    /**
     * Forcer la synchronisation de tous les vélos avec GPS
     */
    async syncAllBikesWithGps() {
        try {
            const bikes = await prisma_1.prisma.bike.findMany({
                where: {
                    code: { not: undefined }
                }
            });
            await this.syncBikesWithGps(bikes);
        }
        catch (error) {
            console.error('Failed to sync all bikes with GPS:', error);
            throw error;
        }
    }
    /**
     * Rechercher des zones/quartiers via Google Places
     */
    async searchAreas(query, country = 'CM') {
        try {
            const areas = await this.placesService.searchPlaces(query, country);
            return areas.map(area => ({
                key: area.key,
                name: area.name,
                location: area.location,
                country: area.country,
                region: area.city
            }));
        }
        catch (error) {
            console.error('Error searching areas:', error);
            return [];
        }
    }
    /**
     * Obtenir les zones par défaut (Cameroun)
     */
    async getDefaultAreas() {
        const areas = this.placesService.getDefaultCameroonAreas();
        return areas.map(area => ({
            key: area.key,
            name: area.name,
            location: area.location,
            country: area.country,
            region: area.city
        }));
    }
    /**
     * Géocoding inversé pour obtenir une adresse
     */
    async reverseGeocode(latitude, longitude) {
        try {
            return await this.placesService.reverseGeocode(latitude, longitude);
        }
        catch (error) {
            console.error('Error reverse geocoding:', error);
            return '';
        }
    }
    /**
     * Obtenir l'historique de trajet GPS d'un vélo
     */
    async getBikeTrack(bikeId, startTime, endTime) {
        const bike = await this.getBikeById(bikeId);
        if (!bike || !bike.code) {
            throw new Error('Bike not found or no GPS code');
        }
        try {
            const startTimeUnix = Math.floor(startTime.getTime() / 1000);
            const endTimeUnix = Math.floor(endTime.getTime() / 1000);
            const track = await this.gpsService.getTrack(bike.code, startTimeUnix, endTimeUnix);
            return track.map(point => ({
                timestamp: this.gpsService.convertUtcToLocalTime(point.nTime),
                latitude: point.dbLat,
                longitude: point.dbLon,
                speed: point.nSpeed,
                direction: point.nDirection,
                batteryLevel: this.gpsService.parseBatteryLevel(point.nFuel)
            }));
        }
        catch (error) {
            console.error('Failed to get bike track:', error);
            return [];
        }
    }
    /**
     * Obtenir le kilométrage d'un vélo sur une période
     */
    async getBikeMileage(bikeId, startTime, endTime) {
        const bike = await this.getBikeById(bikeId);
        if (!bike || !bike.code) {
            throw new Error('Bike not found or no GPS code');
        }
        try {
            const startTimeUnix = Math.floor(startTime.getTime() / 1000);
            const endTimeUnix = Math.floor(endTime.getTime() / 1000);
            const mileage = await this.gpsService.getMileage(bike.code, startTimeUnix, endTimeUnix);
            if (!mileage)
                return null;
            return {
                startMileage: mileage.nStartMileage,
                endMileage: mileage.nEndMileage,
                totalMileage: mileage.nMileage
            };
        }
        catch (error) {
            console.error('Failed to get bike mileage:', error);
            return null;
        }
    }
}
exports.BikeService = BikeService;
exports.default = new BikeService();
//# sourceMappingURL=BikeService.js.map