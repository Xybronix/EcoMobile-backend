import { SupportTicket, TicketMessage } from '../models/types';
export declare class SupportTicketService {
    private ticketRepo;
    private messageRepo;
    private notificationService;
    constructor();
    createTicket(userId: string, data: {
        category: SupportTicket['category'];
        subject: string;
        description: string;
        attachments?: string[];
        relatedRideId?: string;
        relatedBikeId?: string;
    }): Promise<SupportTicket>;
    addMessage(ticketId: string, senderId: string, senderType: 'user' | 'admin', message: string, attachments?: string[], internal?: boolean): Promise<TicketMessage>;
    assignTicket(ticketId: string, assignedTo: string): Promise<SupportTicket>;
    updateTicketStatus(ticketId: string, status: SupportTicket['status'], resolution?: string): Promise<SupportTicket>;
    updateTicketPriority(ticketId: string, priority: SupportTicket['priority']): Promise<SupportTicket>;
    rateTicket(ticketId: string, rating: number): Promise<SupportTicket>;
    getTicketById(id: string): Promise<SupportTicket | null>;
    getUserTickets(userId: string): Promise<SupportTicket[]>;
    getAssignedTickets(assignedTo: string): Promise<SupportTicket[]>;
    getTicketsByStatus(status: string): Promise<SupportTicket[]>;
    getTicketMessages(ticketId: string, includeInternal?: boolean): Promise<TicketMessage[]>;
    getStatistics(): Promise<{
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        averageResolutionTime: number;
    }>;
    getAllTickets(): Promise<SupportTicket[]>;
}
//# sourceMappingURL=SupportTicketService.d.ts.map