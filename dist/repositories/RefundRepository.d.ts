import { BaseRepository } from './BaseRepository';
import { Refund } from '../models/types';
export declare class RefundRepository extends BaseRepository<Refund> {
    constructor();
    findByUserId(userId: string): Promise<Refund[]>;
    findByRideId(rideId: string): Promise<Refund | null>;
    findPending(): Promise<Refund[]>;
    getTotalRefundedAmount(period?: {
        start: Date;
        end: Date;
    }): Promise<number>;
    protected mapToModel(row: any): Refund;
}
//# sourceMappingURL=RefundRepository.d.ts.map