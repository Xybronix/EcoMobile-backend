import { MaintenanceAlertRepository } from '../repositories/MaintenanceAlertRepository';
import { BikeRepository } from '../repositories/BikeRepository';
import { MaintenanceAlert/*, Bike*/ } from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import NotificationService from './NotificationService';

export class MaintenanceAlertService {
  private alertRepo: MaintenanceAlertRepository;
  private bikeRepo: BikeRepository;
  private notificationService: NotificationService;

  constructor() {
    this.alertRepo = new MaintenanceAlertRepository();
    this.bikeRepo = new BikeRepository();
    this.notificationService = new NotificationService();
  }

  async createAlert(
    bikeId: string,
    data: {
      type: MaintenanceAlert['type'];
      severity: MaintenanceAlert['severity'];
      message: string;
      threshold?: number;
      currentValue?: number;
    }
  ): Promise<MaintenanceAlert> {
    const alert: MaintenanceAlert = {
      id: uuidv4(),
      bikeId,
      ...data,
      status: 'active',
      createdAt: new Date()
    };

    const created = await this.alertRepo.create(alert);

    // Notify maintenance team
    await this.notificationService.notifyMaintenanceTeam(created);

    return created;
  }

  async checkAndCreateMaintenanceAlerts(bikeId: string): Promise<MaintenanceAlert[]> {
    const bike = await this.bikeRepo.findById(bikeId);
    if (!bike) {
      throw new Error('Bike not found');
    }

    const alerts: MaintenanceAlert[] = [];

    // Check distance threshold (e.g., every 1000 km)
    const distanceThreshold = 1000; // km
    if (bike.totalDistance > 0 && bike.totalDistance % distanceThreshold < 10) {
      const alert = await this.createAlert(bikeId, {
        type: 'distance',
        severity: 'warning',
        message: `Bike has traveled ${bike.totalDistance}km. Maintenance recommended.`,
        threshold: distanceThreshold,
        currentValue: bike.totalDistance
      });
      alerts.push(alert);
    }

    // Check last maintenance date (e.g., > 30 days)
    if (bike.lastMaintenanceDate) {
      const daysSinceLastMaintenance = Math.floor(
        (Date.now() - bike.lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastMaintenance > 30) {
        const alert = await this.createAlert(bikeId, {
          type: 'time',
          severity: daysSinceLastMaintenance > 60 ? 'critical' : 'warning',
          message: `Last maintenance was ${daysSinceLastMaintenance} days ago. Maintenance required.`,
          threshold: 30,
          currentValue: daysSinceLastMaintenance
        });
        alerts.push(alert);
      }
    }

    // Check battery level for electric bikes
    if (bike.type === 'electric' && bike.batteryLevel !== undefined) {
      if (bike.batteryLevel < 20) {
        const alert = await this.createAlert(bikeId, {
          type: 'battery',
          severity: bike.batteryLevel < 10 ? 'critical' : 'warning',
          message: `Battery level is ${bike.batteryLevel}%. Charging recommended.`,
          threshold: 20,
          currentValue: bike.batteryLevel
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<MaintenanceAlert> {
    const updated = await this.alertRepo.update(alertId, {
      status: 'acknowledged',
      acknowledgedBy,
      acknowledgedAt: new Date()
    });

    if (!updated) {
      throw new Error('Maintenance alert not found');
    }

    return updated;
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<MaintenanceAlert> {
    const updated = await this.alertRepo.update(alertId, {
      status: 'resolved',
      resolvedBy,
      resolvedAt: new Date()
    });

    if (!updated) {
      throw new Error('Maintenance alert not found');
    }

    return updated;
  }

  async getAlertsByBike(bikeId: string): Promise<MaintenanceAlert[]> {
    return await this.alertRepo.findByBikeId(bikeId);
  }

  async getActiveAlerts(): Promise<MaintenanceAlert[]> {
    return await this.alertRepo.findActive();
  }

  async getCriticalAlerts(): Promise<MaintenanceAlert[]> {
    return await this.alertRepo.findCriticalAlerts();
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    critical: number;
    byType: { [key: string]: number };
  }> {
    return await this.alertRepo.getStatistics();
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.alertRepo.delete(alertId);
  }
}
