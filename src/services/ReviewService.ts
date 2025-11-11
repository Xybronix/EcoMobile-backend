import { ReviewRepository } from '../repositories/ReviewRepository';
import { Review } from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import NotificationService from './NotificationService';
// import EmailService from './EmailService';

export class ReviewService {
  private reviewRepo: ReviewRepository;
  private notificationService: NotificationService;
  // private emailService: EmailService;

  constructor() {
    this.reviewRepo = new ReviewRepository();
    this.notificationService = new NotificationService();
    // this.emailService = new EmailService();
  }

  async createReview(
    userId: string,
    data: {
      bikeId?: string;
      rideId?: string;
      rating: number;
      comment?: string;
      category: 'bike' | 'ride' | 'service';
    }
  ): Promise<Review> {
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const review: Review = {
      id: uuidv4(),
      userId,
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.reviewRepo.create(review);

    // Notify admins about new review
    await this.notificationService.notifyAdminsAboutNewReview(created);

    return created;
  }

  async approveReview(reviewId: string, respondedBy: string, response?: string): Promise<Review> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const updated = await this.reviewRepo.update(reviewId, {
      status: 'approved',
      response,
      respondedBy,
      respondedAt: new Date(),
      updatedAt: new Date()
    });

    if (!updated) {
      throw new Error('Failed to update review');
    }

    // Notify user about approval
    await this.notificationService.create({
      userId: review.userId,
      type: 'success',
      category: 'system',
      title: 'Review Approved',
      message: 'Your review has been approved and published',
      read: false
    });

    return updated;
  }

  async rejectReview(reviewId: string, respondedBy: string, reason: string): Promise<Review> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const updated = await this.reviewRepo.update(reviewId, {
      status: 'rejected',
      response: reason,
      respondedBy,
      respondedAt: new Date(),
      updatedAt: new Date()
    });

    if (!updated) {
      throw new Error('Failed to update review');
    }

    // Notify user about rejection
    await this.notificationService.create({
      userId: review.userId,
      type: 'warning',
      category: 'system',
      title: 'Review Not Approved',
      message: `Your review was not approved. Reason: ${reason}`,
      read: false
    });

    return updated;
  }

  async getReviewsByBike(bikeId: string): Promise<Review[]> {
    return await this.reviewRepo.findByBikeId(bikeId);
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return await this.reviewRepo.findByUserId(userId);
  }

  async getPendingReviews(): Promise<Review[]> {
    return await this.reviewRepo.findPending();
  }

  async getAverageRatingByBike(bikeId: string): Promise<number> {
    return await this.reviewRepo.getAverageRatingByBike(bikeId);
  }

  async getOverallStatistics(): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    return await this.reviewRepo.getOverallStatistics();
  }

  async deleteReview(reviewId: string): Promise<void> {
    await this.reviewRepo.delete(reviewId);
  }
}
