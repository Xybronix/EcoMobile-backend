"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundService = void 0;
const RefundRepository_1 = require("../repositories/RefundRepository");
const uuid_1 = require("uuid");
const NotificationService_1 = __importDefault(require("./NotificationService"));
// import EmailService from './EmailService';
const WalletService_1 = require("./WalletService");
class RefundService {
    constructor() {
        this.refundRepo = new RefundRepository_1.RefundRepository();
        this.notificationService = new NotificationService_1.default();
        // this.emailService = new EmailService();
        this.walletService = new WalletService_1.WalletService();
    }
    async requestRefund(userId, data) {
        // Check if refund already exists for this ride
        if (data.rideId) {
            const existing = await this.refundRepo.findByRideId(data.rideId);
            if (existing) {
                throw new Error('A refund request already exists for this ride');
            }
        }
        const refund = {
            id: (0, uuid_1.v4)(),
            userId,
            ...data,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const created = await this.refundRepo.create(refund);
        // Notify user
        await this.notificationService.create({
            userId,
            type: 'info',
            category: 'payment',
            title: 'Refund Request Submitted',
            message: 'Your refund request has been submitted and is being reviewed',
            read: false
        });
        // Notify admins
        await this.notificationService.notifyAdminsAboutRefundRequest(created);
        return created;
    }
    async approveRefund(refundId, processedBy, notes) {
        const refund = await this.refundRepo.findById(refundId);
        if (!refund) {
            throw new Error('Refund not found');
        }
        if (refund.status !== 'pending') {
            throw new Error('Refund has already been processed');
        }
        const updated = await this.refundRepo.update(refundId, {
            status: 'approved',
            processedBy,
            notes,
            processedAt: new Date(),
            updatedAt: new Date()
        });
        if (!updated) {
            throw new Error('Failed to approved refund');
        }
        // Process the refund to user's wallet
        await this.processRefundToWallet(updated);
        return updated;
    }
    async rejectRefund(refundId, processedBy, reason) {
        const refund = await this.refundRepo.findById(refundId);
        if (!refund) {
            throw new Error('Refund not found');
        }
        if (refund.status !== 'pending') {
            throw new Error('Refund has already been processed');
        }
        const updated = await this.refundRepo.update(refundId, {
            status: 'rejected',
            processedBy,
            notes: reason,
            processedAt: new Date(),
            updatedAt: new Date()
        });
        if (!updated) {
            throw new Error('Failed to reject refund');
        }
        // Notify user
        await this.notificationService.create({
            userId: refund.userId,
            type: 'warning',
            category: 'payment',
            title: 'Refund Request Rejected',
            message: `Your refund request has been rejected. Reason: ${reason}`,
            read: false
        });
        return updated;
    }
    async processRefundToWallet(refund) {
        try {
            // Add refund amount to wallet
            await this.walletService.addFunds(refund.userId, refund.amount, 'refund');
            // Update refund status to processed
            await this.refundRepo.update(refund.id, {
                status: 'processed',
                updatedAt: new Date()
            });
            // Notify user
            await this.notificationService.create({
                userId: refund.userId,
                type: 'success',
                category: 'payment',
                title: 'Refund Processed',
                message: `Your refund of ${refund.amount} has been processed to your wallet`,
                read: false
            });
            // Send email
            // await this.emailService.sendRefundConfirmation(refund.userId, refund.amount);
        }
        catch (error) {
            console.error('Error processing refund:', error);
            throw new Error('Failed to process refund to wallet');
        }
    }
    async getPendingRefunds() {
        return await this.refundRepo.findPending();
    }
    async getUserRefunds(userId) {
        return await this.refundRepo.findByUserId(userId);
    }
    async getRefundById(id) {
        return await this.refundRepo.findById(id);
    }
    async getTotalRefundedAmount(period) {
        return await this.refundRepo.getTotalRefundedAmount(period);
    }
}
exports.RefundService = RefundService;
//# sourceMappingURL=RefundService.js.map