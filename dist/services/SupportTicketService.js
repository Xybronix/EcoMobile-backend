"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicketService = void 0;
const SupportTicketRepository_1 = require("../repositories/SupportTicketRepository");
const uuid_1 = require("uuid");
const NotificationService_1 = __importDefault(require("./NotificationService"));
// import EmailService from './EmailService';
class SupportTicketService {
    // private emailService: EmailService;
    constructor() {
        this.ticketRepo = new SupportTicketRepository_1.SupportTicketRepository();
        this.messageRepo = new SupportTicketRepository_1.TicketMessageRepository();
        this.notificationService = new NotificationService_1.default();
        // this.emailService = new EmailService();
    }
    async createTicket(userId, data) {
        // Determine priority based on category
        let priority = 'medium';
        if (data.category === 'technical' || data.category === 'complaint') {
            priority = 'high';
        }
        const ticket = {
            id: (0, uuid_1.v4)(),
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
    async addMessage(ticketId, senderId, senderType, message, attachments, internal = false) {
        const ticket = await this.ticketRepo.findById(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }
        const ticketMessage = {
            id: (0, uuid_1.v4)(),
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
        }
        else if (senderType === 'user' && ticket.assignedTo) {
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
    async assignTicket(ticketId, assignedTo) {
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
    async updateTicketStatus(ticketId, status, resolution) {
        const updates = {
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
    async updateTicketPriority(ticketId, priority) {
        const updated = await this.ticketRepo.update(ticketId, {
            priority,
            updatedAt: new Date()
        });
        if (!updated) {
            throw new Error('Ticket not found');
        }
        return updated;
    }
    async rateTicket(ticketId, rating) {
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
    async getTicketById(id) {
        return await this.ticketRepo.findById(id);
    }
    async getUserTickets(userId) {
        return await this.ticketRepo.findByUserId(userId);
    }
    async getAssignedTickets(assignedTo) {
        return await this.ticketRepo.findByAssignee(assignedTo);
    }
    async getTicketsByStatus(status) {
        return await this.ticketRepo.findByStatus(status);
    }
    async getTicketMessages(ticketId, includeInternal = false) {
        return await this.messageRepo.findByTicketId(ticketId, includeInternal);
    }
    async getStatistics() {
        return await this.ticketRepo.getStatistics();
    }
    async getAllTickets() {
        return await this.ticketRepo.findAll({});
    }
}
exports.SupportTicketService = SupportTicketService;
//# sourceMappingURL=SupportTicketService.js.map