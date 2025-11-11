import { SystemHealth } from '../models/types';
import { getDb } from '../config/database';
import EmailService from './EmailService';
// import { PaymentService } from './PaymentService';

export class HealthCheckService {
  private emailService: EmailService;
  // private paymentService: PaymentService;
  private startTime: number;

  constructor() {
    this.emailService = new EmailService();
    // this.paymentService = new PaymentService();
    this.startTime = Date.now();
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const services = await this.checkServices();
    const metrics = await this.getMetrics();

    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    
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

  private async checkServices(): Promise<{
    database: boolean;
    email: boolean;
    payment: boolean;
    geolocation: boolean;
  }> {
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

  private async checkDatabase(): Promise<boolean> {
    try {
      const db = getDb();
      await db.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  private async checkEmail(): Promise<boolean> {
    try {
      // Check if email service is configured
      return this.emailService.isConfigured();
    } catch (error) {
      console.error('Email health check failed:', error);
      return false;
    }
  }

  private async checkPayment(): Promise<boolean> {
    try {
      // Check if payment service is configured
      return true; // Would check payment API connectivity
    } catch (error) {
      console.error('Payment health check failed:', error);
      return false;
    }
  }

  private async checkGeolocation(): Promise<boolean> {
    try {
      // Check if geolocation service is available
      return true; // Would check geolocation API
    } catch (error) {
      console.error('Geolocation health check failed:', error);
      return false;
    }
  }

  private async getMetrics(): Promise<{
    uptime: number;
    responseTime: number;
    activeUsers: number;
    activeBikes: number;
    activeRides: number;
  }> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    // Measure database response time
    const start = Date.now();
    try {
      const db = getDb();
      await db.query('SELECT 1');
    } catch (error) {
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

  private async getActiveUserCount(): Promise<number> {
    try {
      const db = getDb();
      const result = await db.query(
        "SELECT COUNT(*) as count FROM users WHERE status = 'active'"
      );
      return result[0]?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getActiveBikeCount(): Promise<number> {
    try {
      const db = getDb();
      const result = await db.query(
        "SELECT COUNT(*) as count FROM bikes WHERE status = 'available'"
      );
      return result[0]?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getActiveRideCount(): Promise<number> {
    try {
      const db = getDb();
      const result = await db.query(
        "SELECT COUNT(*) as count FROM rides WHERE status = 'in_progress'"
      );
      return result[0]?.count || 0;
    } catch (error) {
      return 0;
    }
  }
}
