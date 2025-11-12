import { Statistics } from '../models/types';
export declare class StatisticsService {
    private userRepo;
    private bikeRepo;
    private rideRepo;
    private transactionRepo;
    constructor();
    getOverallStatistics(): Promise<Statistics>;
    private getTotalUsers;
    private getActiveUsers;
    private getTotalBikes;
    private getAvailableBikes;
    private getTotalRides;
    private getActiveRides;
    private getRevenue;
    private getRevenueForPeriod;
    private getPopularRoutes;
    private getBikeUtilization;
    private getPeakHours;
    getUserStatistics(userId: string): Promise<{
        totalRides: number;
        totalDistance: number;
        totalSpent: number;
        averageRideDuration: number;
        favoriteRoute?: {
            start: string;
            end: string;
        };
    }>;
    getBikeStatistics(bikeId: string): Promise<{
        totalRides: number;
        totalDistance: number;
        totalRevenue: number;
        averageRating: number;
        utilizationRate: number;
    }>;
}
//# sourceMappingURL=StatisticsService.d.ts.map