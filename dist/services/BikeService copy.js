"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BikeService = void 0;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
class BikeService {
    /**
     * Create a new bike
     */
    async createBike(data) {
        // Generate QR code
        const qrCode = `FREEBIKE-${data.code}-${(0, uuid_1.v4)()}`;
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
        return await prisma_1.prisma.bike.findUnique({
            where: { id },
            include: {
                maintenanceLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
    }
    /**
     * Get bike by code or QR code
     */
    async getBikeByCode(code) {
        return await prisma_1.prisma.bike.findFirst({
            where: {
                OR: [
                    { code },
                    { qrCode: code }
                ]
            }
        });
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
            return {
                bikes,
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
                latitude: { not: null },
                longitude: { not: null }
            }
        });
        // Filter bikes within radius using Haversine formula
        const nearbyBikes = bikes.filter((bike) => {
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
}
exports.BikeService = BikeService;
exports.default = new BikeService();
//# sourceMappingURL=BikeService%20copy.js.map