import { BaseRepository } from './BaseRepository';
import { Review } from '../models/types';
export declare class ReviewRepository extends BaseRepository<Review> {
    constructor();
    findByBikeId(bikeId: string): Promise<Review[]>;
    findByUserId(userId: string): Promise<Review[]>;
    findPending(): Promise<Review[]>;
    getAverageRatingByBike(bikeId: string): Promise<number>;
    getOverallStatistics(): Promise<{
        averageRating: number;
        totalReviews: number;
        ratingDistribution: {
            [key: number]: number;
        };
    }>;
    protected mapToModel(row: any): Review;
}
//# sourceMappingURL=ReviewRepository.d.ts.map