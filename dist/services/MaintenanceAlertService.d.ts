import { MaintenanceAlert } from '../models/types';
export declare class MaintenanceAlertService {
    private alertRepo;
    private bikeRepo;
    private notificationService;
    constructor();
    createAlert(bikeId: string, data: {
        type: MaintenanceAlert['type'];
        severity: MaintenanceAlert['severity'];
        message: string;
        threshold?: number;
        currentValue?: number;
    }): Promise<MaintenanceAlert>;
    checkAndCreateMaintenanceAlerts(bikeId: string): Promise<MaintenanceAlert[]>;
    acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<MaintenanceAlert>;
    resolveAlert(alertId: string, resolvedBy: string): Promise<MaintenanceAlert>;
    getAlertsByBike(bikeId: string): Promise<MaintenanceAlert[]>;
    getActiveAlerts(): Promise<MaintenanceAlert[]>;
    getCriticalAlerts(): Promise<MaintenanceAlert[]>;
    getStatistics(): Promise<{
        total: number;
        active: number;
        critical: number;
        byType: {
            [key: string]: number;
        };
    }>;
    deleteAlert(alertId: string): Promise<void>;
}
//# sourceMappingURL=MaintenanceAlertService.d.ts.map