import { SupportTicketRepository, TicketMessageRepository } from '../repositories/SupportTicketRepository';
import { SupportTicket, TicketMessage } from '../models/types';
import { randomUUID } from 'crypto';
import NotificationService from './NotificationService';
// import EmailService from './EmailService';

export class SupportTicketService {
  private ticketRepo: SupportTicketRepository;
  private messageRepo: TicketMessageRepository;
  private notificationService: NotificationService;
  // private emailService: EmailService;

  constructor() {
    this.ticketRepo = new SupportTicketRepository();
    this.messageRepo = new TicketMessageRepository();
    this.notificationService = new NotificationService();
    // this.emailService = new EmailService();
  }

  async createTicket(
    userId: string,
    data: {
      category: SupportTicket['category'];
      subject: string;
      description: string;
      attachments?: string[];
      relatedRideId?: string;
      relatedBikeId?: string;
    }
  ): Promise<SupportTicket> {
    // Determine priority based on category
    let priority: SupportTicket['priority'] = 'medium';
    if (data.category === 'technical' || data.category === 'complaint') {
      priority = 'high';
    }

    const ticket: SupportTicket = {
      id: randomUUID(),
      userId,
      ...data,
      priority,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await this.ticketRepo.create(ticket);

    // Notify admins about new ticket
    await this.notificationService.notifyAdminsAboutNewTicket(created);

    // Send confirmation email to user
    // await this.emailService.sendTicketCreatedConfirmation(userId, ticket);

    return created;
  }

  async addMessage(
    ticketId: string,
    senderId: string,
    senderType: 'user' | 'admin',
    message: string,
    attachments?: string[],
    internal: boolean = false
  ): Promise<TicketMessage> {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const ticketMessage: TicketMessage = {
      id: randomUUID(),
      ticketId,
      senderId,
      senderType,
      message,
      attachments,
      internal,
      createdAt: new Date()
    };

    const created = await this.messageRepo.create(ticketMessage);

    // Update ticket status and timestamp
    if (ticket.status === 'open' && senderType === 'admin') {
      await this.ticketRepo.update(ticketId, {
        status: 'in_progress',
        updatedAt: new Date()
      });
    }

    // Notify the other party
    if (senderType === 'admin' && !internal) {
      await this.notificationService.create({
        userId: ticket.userId,
        type: 'info',
        category: 'system',
        title: 'New Response to Your Ticket',
        message: `You have a new response on ticket #${ticketId.substring(0, 8)}`,
        actionUrl: `/support/tickets/${ticketId}`,
        read: false
      });
    } else if (senderType === 'user' && ticket.assignedTo) {
      await this.notificationService.create({
        userId: ticket.assignedTo,
        type: 'info',
        category: 'system',
        title: 'New User Response',
        message: `User replied to ticket #${ticketId.substring(0, 8)}`,
        actionUrl: `/admin/support/tickets/${ticketId}`,
        read: false
      });
    }

    return created;
  }

  async assignTicket(ticketId: string, assignedTo: string): Promise<SupportTicket> {
    const updated = await this.ticketRepo.update(ticketId, {
      assignedTo,
      status: 'in_progress',
      updatedAt: new Date()
    });

    if (!updated) {
      throw new Error('Ticket not found');
    }

    return updated;
  }

  async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status'],
    resolution?: string
  ): Promise<SupportTicket> {
    const updates: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'resolved' || status === 'closed') {
      updates.resolvedAt = new Date();
      if (resolution) {
        updates.resolution = resolution;
      }
    }

    const updated = await this.ticketRepo.update(ticketId, updates);

    if (!updated) {
      throw new Error('Ticket not found');
    }

    // Notify user
    if (status === 'resolved') {
      await this.notificationService.create({
        userId: updated.userId,
        type: 'success',
        category: 'system',
        title: 'Ticket Resolved',
        message: `Your support ticket has been resolved: ${updated.subject}`,
        actionUrl: `/support/tickets/${ticketId}`,
        read: false
      });
    }

    return updated;
  }

  async updateTicketPriority(
    ticketId: string,
    priority: SupportTicket['priority']
  ): Promise<SupportTicket> {
     const updated = await this.ticketRepo.update(ticketId, {
      priority,
      updatedAt: new Date()
    });

    if (!updated) {
      throw new Error('Ticket not found');
    }

    return updated;
  }

  async rateTicket(ticketId: string, rating: number): Promise<SupportTicket> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const updated = await this.ticketRepo.update(ticketId, {
      satisfactionRating: rating,
      updatedAt: new Date()
    });

    if (!updated) {
      throw new Error('Ticket not found');
    }

    return updated;
  }

  async getTicketById(id: string): Promise<SupportTicket | null> {
    return await this.ticketRepo.findById(id);
  }

  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    return await this.ticketRepo.findByUserId(userId);
  }

  async getAssignedTickets(assignedTo: string): Promise<SupportTicket[]> {
    return await this.ticketRepo.findByAssignee(assignedTo);
  }

  async getTicketsByStatus(status: string): Promise<SupportTicket[]> {
    return await this.ticketRepo.findByStatus(status);
  }

  async getTicketMessages(ticketId: string, includeInternal: boolean = false): Promise<TicketMessage[]> {
    return await this.messageRepo.findByTicketId(ticketId, includeInternal);
  }

  async getStatistics(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    averageResolutionTime: number;
  }> {
    return await this.ticketRepo.getStatistics();
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    return await this.ticketRepo.findAll({});
  }
}
