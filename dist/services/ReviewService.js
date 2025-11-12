"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const ReviewRepository_1 = require("../repositories/ReviewRepository");
const uuid_1 = require("uuid");
const NotificationService_1 = __importDefault(require("./NotificationService"));
// import EmailService from './EmailService';
class ReviewService {
    // private emailService: EmailService;
    constructor() {
        this.reviewRepo = new ReviewRepository_1.ReviewRepository();
        this.notificationService = new NotificationService_1.default();
        // this.emailService = new EmailService();
    }
    async createReview(userId, data) {
        if (data.rating < 1 || data.rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }
        const review = {
            id: (0, uuid_1.v4)(),
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
    async approveReview(reviewId, respondedBy, response) {
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
    async rejectReview(reviewId, respondedBy, reason) {
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
    async getReviewsByBike(bikeId) {
        return await this.reviewRepo.findByBikeId(bikeId);
    }
    async getReviewsByUser(userId) {
        return await this.reviewRepo.findByUserId(userId);
    }
    async getPendingReviews() {
        return await this.reviewRepo.findPending();
    }
    async getAverageRatingByBike(bikeId) {
        return await this.reviewRepo.getAverageRatingByBike(bikeId);
    }
    async getOverallStatistics() {
        return await this.reviewRepo.getOverallStatistics();
    }
    async deleteReview(reviewId) {
        await this.reviewRepo.delete(reviewId);
    }
}
exports.ReviewService = ReviewService;
//# sourceMappingURL=ReviewService.js.map