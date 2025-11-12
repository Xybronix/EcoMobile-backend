"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsService = void 0;
const repositories_1 = require("../repositories");
const repositories_2 = require("../repositories");
class StatisticsService {
    constructor() {
        this.userRepo = new repositories_1.UserRepository();
        this.bikeRepo = new repositories_1.BikeRepository();
        this.rideRepo = new repositories_1.RideRepository();
        this.transactionRepo = new repositories_2.TransactionRepository();
    }
    async getOverallStatistics() {
        const [totalUsers, activeUsers, totalBikes, availableBikes, totalRides, activeRides, revenue, popularRoutes, bikeUtilization, peakHours] = await Promise.all([
            this.getTotalUsers(),
            this.getActiveUsers(),
            this.getTotalBikes(),
            this.getAvailableBikes(),
            this.getTotalRides(),
            this.getActiveRides(),
            this.getRevenue(),
            this.getPopularRoutes(),
            this.getBikeUtilization(),
            this.getPeakHours()
        ]);
        return {
            totalUsers,
            activeUsers,
            totalBikes,
            availableBikes,
            totalRides,
            activeRides,
            revenue,
            popularRoutes,
            bikeUtilization,
            peakHours
        };
    }
    async getTotalUsers() {
        const users = await this.userRepo.findAll({});
        return users.length;
    }
    async getActiveUsers() {
        const users = await this.userRepo.findAll({ where: { status: 'active' } });
        return users.length;
    }
    async getTotalBikes() {
        const bikes = await this.bikeRepo.findAll({});
        return bikes.length;
    }
    async getAvailableBikes() {
        const bikes = await this.bikeRepo.findAvailableBikes();
        return bikes.length;
    }
    async getTotalRides() {
        const rides = await this.rideRepo.findAll({});
        return rides.length;
    }
    async getActiveRides() {
        const rides = await this.rideRepo.findActive();
        return rides.length;
    }
    async getRevenue() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const [todayRevenue, weekRevenue, monthRevenue, yearRevenue] = await Promise.all([
            this.getRevenueForPeriod(today, now),
            this.getRevenueForPeriod(weekAgo, now),
            this.getRevenueForPeriod(monthAgo, now),
            this.getRevenueForPeriod(yearAgo, now)
        ]);
        return {
            today: todayRevenue,
            week: weekRevenue,
            month: monthRevenue,
            year: yearRevenue
        };
    }
    async getRevenueForPeriod(start, end) {
        const transactions = await this.transactionRepo.findAll({});
        const filtered = transactions.filter(t => {
            const createdAt = new Date(t.createdAt);
            return (t.status === 'completed' &&
                t.type === 'ride' &&
                createdAt >= start &&
                createdAt <= end);
        });
        return filtered.reduce((sum, t) => sum + t.amount, 0);
    }
    async getPopularRoutes() {
        const rides = await this.rideRepo.findAll({
            where: { status: 'completed' }
        });
        const routeMap = new Map();
        rides.forEach(ride => {
            if (ride.startLocation?.address && ride.endLocation?.address) {
                const key = `${ride.startLocation.address}|${ride.endLocation.address}`;
                routeMap.set(key, (routeMap.get(key) || 0) + 1);
            }
        });
        const routes = Array.from(routeMap.entries())
            .map(([key, count]) => {
            const [start, end] = key.split('|');
            return { startLocation: start, endLocation: end, count };
        })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return routes;
    }
    async getBikeUtilization() {
        const bikes = await this.bikeRepo.findAll({});
        const utilization = bikes.map(bike => ({
            bikeId: bike.id,
            bikeNumber: bike.bikeNumber,
            utilizationRate: Math.round((bike.totalRides / Math.max(bike.totalRides + 100, 1)) * 100)
        })).sort((a, b) => b.utilizationRate - a.utilizationRate)
            .slice(0, 10);
        return utilization;
    }
    async getPeakHours() {
        const rides = await this.rideRepo.findAll({
            where: { status: 'completed' }
        });
        const hourMap = new Map();
        rides.forEach(ride => {
            const hour = new Date(ride.startTime).getHours();
            hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        });
        const hours = Array.from(hourMap.entries())
            .map(([hour, count]) => ({ hour, rideCount: count }))
            .sort((a, b) => a.hour - b.hour);
        // Fill missing hours with 0
        for (let i = 0; i < 24; i++) {
            if (!hours.find(h => h.hour === i)) {
                hours.push({ hour: i, rideCount: 0 });
            }
        }
        return hours.sort((a, b) => a.hour - b.hour);
    }
    async getUserStatistics(userId) {
        const rides = await this.rideRepo.findByUserId(userId);
        const completedRides = rides.filter(r => r.status === 'completed');
        const totalRides = completedRides.length;
        const totalDistance = completedRides.reduce((sum, r) => sum + (r.distance || 0), 0);
        const totalSpent = completedRides.reduce((sum, r) => sum + (r.cost || 0), 0);
        const totalDuration = completedRides.reduce((sum, r) => sum + (r.duration || 0), 0);
        const averageRideDuration = totalRides > 0 ? totalDuration / totalRides : 0;
        // Find favorite route
        const routeMap = new Map();
        completedRides.forEach(ride => {
            if (ride.startLocation?.address && ride.endLocation?.address) {
                const key = `${ride.startLocation.address}|${ride.endLocation.address}`;
                routeMap.set(key, (routeMap.get(key) || 0) + 1);
            }
        });
        let favoriteRoute;
        if (routeMap.size > 0) {
            const [mostCommon] = Array.from(routeMap.entries())
                .sort((a, b) => b[1] - a[1]);
            const [start, end] = mostCommon[0].split('|');
            favoriteRoute = { start, end };
        }
        return {
            totalRides,
            totalDistance,
            totalSpent,
            averageRideDuration,
            favoriteRoute
        };
    }
    async getBikeStatistics(bikeId) {
        const bike = await this.bikeRepo.findById(bikeId);
        if (!bike) {
            throw new Error('Bike not found');
        }
        const rides = await this.rideRepo.findByBikeId(bikeId);
        const completedRides = rides.filter(r => r.status === 'completed');
        const totalRevenue = completedRides.reduce((sum, r) => sum + (r.cost || 0), 0);
        return {
            totalRides: bike.totalRides,
            totalDistance: bike.totalDistance,
            totalRevenue,
            averageRating: 0, // Would need to fetch from reviews
            utilizationRate: Math.round((bike.totalRides / Math.max(bike.totalRides + 100, 1)) * 100)
        };
    }
}
exports.StatisticsService = StatisticsService;
//# sourceMappingURL=StatisticsService.js.map