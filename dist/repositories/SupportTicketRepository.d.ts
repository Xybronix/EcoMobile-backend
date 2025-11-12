import { BaseRepository } from './BaseRepository';
import { SupportTicket, TicketMessage } from '../models/types';
export declare class SupportTicketRepository extends BaseRepository<SupportTicket> {
    constructor();
    findByUserId(userId: string): Promise<SupportTicket[]>;
    findByAssignee(assignedTo: string): Promise<SupportTicket[]>;
    findByStatus(status: string): Promise<SupportTicket[]>;
    getStatistics(): Promise<{
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
        averageResolutionTime: number;
    }>;
    protected mapToModel(row: any): SupportTicket;
}
export declare class TicketMessageRepository extends BaseRepository<TicketMessage> {
    constructor();
    findByTicketId(ticketId: string, includeInternal?: boolean): Promise<TicketMessage[]>;
    protected mapToModel(row: any): TicketMessage;
}
//# sourceMappingURL=SupportTicketRepository.d.ts.map