import { BaseRepository } from './BaseRepository';
import { MaintenanceAlert } from '../models/types';
export declare class MaintenanceAlertRepository extends BaseRepository<MaintenanceAlert> {
    constructor();
    findByBikeId(bikeId: string): Promise<MaintenanceAlert[]>;
    findActive(): Promise<MaintenanceAlert[]>;
    findBySeverity(severity: string): Promise<MaintenanceAlert[]>;
    findCriticalAlerts(): Promise<MaintenanceAlert[]>;
    getStatistics(): Promise<{
        total: number;
        active: number;
        critical: number;
        byType: {
            [key: string]: number;
        };
    }>;
    protected mapToModel(row: any): MaintenanceAlert;
}
//# sourceMappingURL=MaintenanceAlertRepository.d.ts.map