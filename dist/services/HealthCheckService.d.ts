import { SystemHealth } from '../models/types';
export declare class HealthCheckService {
    private emailService;
    private startTime;
    constructor();
    getSystemHealth(): Promise<SystemHealth>;
    private checkServices;
    private checkDatabase;
    private checkEmail;
    private checkPayment;
    private checkGeolocation;
    private getMetrics;
    private getActiveUserCount;
    private getActiveBikeCount;
    private getActiveRideCount;
}
//# sourceMappingURL=HealthCheckService.d.ts.map