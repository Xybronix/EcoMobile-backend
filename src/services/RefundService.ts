import { RefundRepository } from '../repositories/RefundRepository';
import { Refund } from '../models/types';
import { randomUUID } from 'crypto';
import NotificationService from './NotificationService';
// import EmailService from './EmailService';
import { WalletService } from './WalletService';

export class RefundService {
  private refundRepo: RefundRepository;
  private notificationService: NotificationService;
  // private emailService: EmailService;
  private walletService: WalletService;

  constructor() {
    this.refundRepo = new RefundRepository();
    this.notificationService = new NotificationService();
    // this.emailService = new EmailService();
    this.walletService = new WalletService();
  }

  async requestRefund(
    userId: string,
    data: {
      rideId?: string;
      transactionId: string;
      amount: number;
      reason: string;
    }
  ): Promise<Refund> {
    // Check if refund already exists for this ride
    if (data.rideId) {
      const existing = await this.refundRepo.findByRideId(data.rideId);
      if (existing) {
        throw new Error('A refund request already exists for this ride');
      }
    }

    const refund: Refund = {
      id: randomUUID(),
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

  async approveRefund(refundId: string, processedBy: string, notes?: string): Promise<Refund> {
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

  async rejectRefund(refundId: string, processedBy: string, reason: string): Promise<Refund> {
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

  private async processRefundToWallet(refund: Refund): Promise<void> {
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
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error('Failed to process refund to wallet');
    }
  }

  async getPendingRefunds(): Promise<Refund[]> {
    return await this.refundRepo.findPending();
  }

  async getUserRefunds(userId: string): Promise<Refund[]> {
    return await this.refundRepo.findByUserId(userId);
  }

  async getRefundById(id: string): Promise<Refund | null> {
    return await this.refundRepo.findById(id);
  }

  async getTotalRefundedAmount(period?: { start: Date; end: Date }): Promise<number> {
    return await this.refundRepo.getTotalRefundedAmount(period);
  }
}
