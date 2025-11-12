"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideService = void 0;
// services/RideService.ts
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
const BikeService_1 = __importDefault(require("./BikeService"));
const errorHandler_1 = require("../middleware/errorHandler");
const locales_1 = require("../locales");
class RideService {
    constructor() { }
    async startRide(userId, bikeId, startLocation, language = 'fr') {
        // Check if user has active ride
        const activeRide = await prisma_1.prisma.ride.findFirst({
            where: {
                userId,
                status: client_1.RideStatus.IN_PROGRESS
            }
        });
        if (activeRide) {
            throw new errorHandler_1.AppError((0, locales_1.t)('ride.already_in_progress', language), 400);
        }
        // Check if bike is available and unlock it
        const bike = await BikeService_1.default.getBikeById(bikeId);
        if (!bike) {
            throw new errorHandler_1.AppError((0, locales_1.t)('bike.not_found', language), 404);
        }
        if (bike.status !== 'AVAILABLE') {
            throw new errorHandler_1.AppError((0, locales_1.t)('bike.unavailable', language), 400);
        }
        // Check user wallet balance
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true }
        });
        if (!user?.wallet || user.wallet.balance < 5) { // Minimum 5 units required
            throw new errorHandler_1.AppError((0, locales_1.t)('wallet.insufficient_balance', language), 400);
        }
        try {
            // Start transaction
            const ride = await prisma_1.prisma.$transaction(async (tx) => {
                // Create ride
                const newRide = await tx.ride.create({
                    data: {
                        userId,
                        bikeId,
                        startTime: new Date(),
                        startLatitude: startLocation.latitude,
                        startLongitude: startLocation.longitude,
                        status: client_1.RideStatus.IN_PROGRESS
                    }
                });
                // Unlock bike via BikeService (which handles GPS sync)
                await BikeService_1.default.unlockBike(bikeId);
                return newRide;
            });
            // Send notification
            await prisma_1.prisma.notification.create({
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
        }
        catch (error) {
            console.error('Error starting ride:', error);
            throw new errorHandler_1.AppError('Failed to start ride', 500);
        }
    }
    async endRide(rideId, endLocation, language = 'fr') {
        // Find ride
        const ride = await prisma_1.prisma.ride.findUnique({
            where: { id: rideId },
            include: {
                bike: true,
                user: { include: { wallet: true } }
            }
        });
        if (!ride) {
            throw new errorHandler_1.AppError((0, locales_1.t)('ride.not_found', language), 404);
        }
        if (ride.status !== client_1.RideStatus.IN_PROGRESS) {
            throw new errorHandler_1.AppError((0, locales_1.t)('ride.not_in_progress', language), 400);
        }
        // Calculate duration in minutes
        const duration = Math.floor((new Date().getTime() - new Date(ride.startTime).getTime()) / 1000 / 60);
        // Calculate distance using BikeService method
        let distance = BikeService_1.default.calculateDistance(ride.startLatitude, ride.startLongitude, endLocation.latitude, endLocation.longitude);
        // Get GPS track for the ride period
        let gpsTrack = [];
        try {
            if (ride.bike?.code) {
                gpsTrack = await BikeService_1.default.getBikeTrack(ride.bikeId, ride.startTime, new Date());
                // Calculate more accurate distance from GPS track if available
                if (gpsTrack.length > 1) {
                    let totalDistance = 0;
                    for (let i = 1; i < gpsTrack.length; i++) {
                        totalDistance += BikeService_1.default.calculateDistance(gpsTrack[i - 1].latitude, gpsTrack[i - 1].longitude, gpsTrack[i].latitude, gpsTrack[i].longitude);
                    }
                    // Use GPS distance if it's reasonable (not too different from straight line)
                    if (totalDistance > distance && totalDistance < distance * 3) {
                        distance = totalDistance;
                    }
                }
            }
        }
        catch (error) {
            console.warn('Failed to get GPS track for ride:', error);
        }
        // Simple pricing: 0.5 per minute + 1 unlock fee
        const cost = Math.round((0.5 * duration + 1) * 100) / 100;
        // Check wallet balance
        if (!ride.user.wallet || ride.user.wallet.balance < cost) {
            throw new errorHandler_1.AppError((0, locales_1.t)('wallet.insufficient_balance', language), 400);
        }
        try {
            // Complete ride in transaction
            const updatedRide = await prisma_1.prisma.$transaction(async (tx) => {
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
                        status: client_1.RideStatus.COMPLETED
                    },
                    include: {
                        bike: true,
                        user: { include: { wallet: true } }
                    }
                });
                // Deduct from wallet
                await tx.wallet.update({
                    where: { id: ride.user.wallet.id },
                    data: {
                        balance: { decrement: cost }
                    }
                });
                // Create transaction
                await tx.transaction.create({
                    data: {
                        walletId: ride.user.wallet.id,
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
                await BikeService_1.default.lockBike(ride.bikeId);
                await BikeService_1.default.updateBikeLocation(ride.bikeId, endLocation.latitude, endLocation.longitude);
            }
            catch (error) {
                console.error('Failed to lock bike or update location:', error);
            }
            // Send notification
            await prisma_1.prisma.notification.create({
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
        }
        catch (error) {
            console.error('Error ending ride:', error);
            throw new errorHandler_1.AppError('Failed to end ride', 500);
        }
    }
    async getUserRides(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [rides, total] = await Promise.all([
            prisma_1.prisma.ride.findMany({
                where: { userId },
                include: {
                    bike: true
                },
                orderBy: { startTime: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.prisma.ride.count({ where: { userId } })
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
    async getActiveRide(userId, _language = 'fr') {
        const ride = await prisma_1.prisma.ride.findFirst({
            where: {
                userId,
                status: client_1.RideStatus.IN_PROGRESS
            },
            include: {
                bike: true,
                user: true
            }
        });
        if (!ride)
            return null;
        // Get real-time bike location if available
        if (ride.bike?.code) {
            try {
                const updatedBike = await BikeService_1.default.getBikeById(ride.bikeId);
                if (updatedBike) {
                    ride.bike = updatedBike;
                }
            }
            catch (error) {
                console.warn('Failed to get updated bike location:', error);
            }
        }
        return ride;
    }
    async getRideById(rideId) {
        const ride = await prisma_1.prisma.ride.findUnique({
            where: { id: rideId },
            include: {
                bike: true,
                user: true
            }
        });
        if (!ride)
            return null;
        // Get GPS track if ride is completed
        if (ride.status === client_1.RideStatus.COMPLETED && ride.endTime) {
            try {
                const gpsTrack = await BikeService_1.default.getBikeTrack(ride.bikeId, ride.startTime, ride.endTime);
                return { ...ride, gpsTrack };
            }
            catch (error) {
                console.warn('Failed to get GPS track for completed ride:', error);
            }
        }
        return ride;
    }
    async cancelRide(rideId, userId, language = 'fr') {
        const ride = await prisma_1.prisma.ride.findFirst({
            where: {
                id: rideId,
                userId,
                status: client_1.RideStatus.IN_PROGRESS
            },
            include: { bike: true }
        });
        if (!ride) {
            throw new errorHandler_1.AppError((0, locales_1.t)('ride.not_found', language), 404);
        }
        try {
            const cancelledRide = await prisma_1.prisma.$transaction(async (tx) => {
                // Update ride status
                const updatedRide = await tx.ride.update({
                    where: { id: rideId },
                    data: {
                        status: client_1.RideStatus.CANCELLED,
                        endTime: new Date()
                    }
                });
                return updatedRide;
            });
            // Lock bike and sync location
            try {
                await BikeService_1.default.lockBike(ride.bikeId);
            }
            catch (error) {
                console.error('Failed to lock bike after cancellation:', error);
            }
            // Send notification
            await prisma_1.prisma.notification.create({
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
        }
        catch (error) {
            console.error('Error cancelling ride:', error);
            throw new errorHandler_1.AppError('Failed to cancel ride', 500);
        }
    }
    async getRideStats(userId) {
        const stats = await prisma_1.prisma.ride.aggregate({
            where: {
                userId,
                status: client_1.RideStatus.COMPLETED
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
exports.RideService = RideService;
exports.default = new RideService();
//# sourceMappingURL=RideService.js.map