"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckService = void 0;
const database_1 = require("../config/database");
const EmailService_1 = __importDefault(require("./EmailService"));
// import { PaymentService } from './PaymentService';
class HealthCheckService {
    constructor() {
        this.emailService = new EmailService_1.default();
        // this.paymentService = new PaymentService();
        this.startTime = Date.now();
    }
    async getSystemHealth() {
        const services = await this.checkServices();
        const metrics = await this.getMetrics();
        let status = 'healthy';
        const failedServices = Object.values(services).filter(s => !s).length;
        if (failedServices > 0) {
            status = failedServices >= 2 ? 'down' : 'degraded';
        }
        return {
            status,
            timestamp: new Date(),
            services,
            metrics
        };
    }
    async checkServices() {
        const [database, email, payment, geolocation] = await Promise.all([
            this.checkDatabase(),
            this.checkEmail(),
            this.checkPayment(),
            this.checkGeolocation()
        ]);
        return {
            database,
            email,
            payment,
            geolocation
        };
    }
    async checkDatabase() {
        try {
            const db = (0, database_1.getDb)();
            await db.query('SELECT 1');
            return true;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
    async checkEmail() {
        try {
            // Check if email service is configured
            return this.emailService.isConfigured();
        }
        catch (error) {
            console.error('Email health check failed:', error);
            return false;
        }
    }
    async checkPayment() {
        try {
            // Check if payment service is configured
            return true; // Would check payment API connectivity
        }
        catch (error) {
            console.error('Payment health check failed:', error);
            return false;
        }
    }
    async checkGeolocation() {
        try {
            // Check if geolocation service is available
            return true; // Would check geolocation API
        }
        catch (error) {
            console.error('Geolocation health check failed:', error);
            return false;
        }
    }
    async getMetrics() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        // Measure database response time
        const start = Date.now();
        try {
            const db = (0, database_1.getDb)();
            await db.query('SELECT 1');
        }
        catch (error) {
            // Ignore
        }
        const responseTime = Date.now() - start;
        // Get active counts
        const [activeUsers, activeBikes, activeRides] = await Promise.all([
            this.getActiveUserCount(),
            this.getActiveBikeCount(),
            this.getActiveRideCount()
        ]);
        return {
            uptime,
            responseTime,
            activeUsers,
            activeBikes,
            activeRides
        };
    }
    async getActiveUserCount() {
        try {
            const db = (0, database_1.getDb)();
            const result = await db.query("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
            return result[0]?.count || 0;
        }
        catch (error) {
            return 0;
        }
    }
    async getActiveBikeCount() {
        try {
            const db = (0, database_1.getDb)();
            const result = await db.query("SELECT COUNT(*) as count FROM bikes WHERE status = 'available'");
            return result[0]?.count || 0;
        }
        catch (error) {
            return 0;
        }
    }
    async getActiveRideCount() {
        try {
            const db = (0, database_1.getDb)();
            const result = await db.query("SELECT COUNT(*) as count FROM rides WHERE status = 'in_progress'");
            return result[0]?.count || 0;
        }
        catch (error) {
            return 0;
        }
    }
}
exports.HealthCheckService = HealthCheckService;
//# sourceMappingURL=HealthCheckService.js.map