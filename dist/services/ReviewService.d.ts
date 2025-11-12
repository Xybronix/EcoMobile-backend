import { Review } from '../models/types';
export declare class ReviewService {
    private reviewRepo;
    private notificationService;
    constructor();
    createReview(userId: string, data: {
        bikeId?: string;
        rideId?: string;
        rating: number;
        comment?: string;
        category: 'bike' | 'ride' | 'service';
    }): Promise<Review>;
    approveReview(reviewId: string, respondedBy: string, response?: string): Promise<Review>;
    rejectReview(reviewId: string, respondedBy: string, reason: string): Promise<Review>;
    getReviewsByBike(bikeId: string): Promise<Review[]>;
    getReviewsByUser(userId: string): Promise<Review[]>;
    getPendingReviews(): Promise<Review[]>;
    getAverageRatingByBike(bikeId: string): Promise<number>;
    getOverallStatistics(): Promise<{
        averageRating: number;
        totalReviews: number;
        ratingDistribution: {
            [key: number]: number;
        };
    }>;
    deleteReview(reviewId: string): Promise<void>;
}
//# sourceMappingURL=ReviewService.d.ts.map