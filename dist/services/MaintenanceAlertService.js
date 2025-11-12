"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceAlertService = void 0;
const MaintenanceAlertRepository_1 = require("../repositories/MaintenanceAlertRepository");
const BikeRepository_1 = require("../repositories/BikeRepository");
const uuid_1 = require("uuid");
const NotificationService_1 = __importDefault(require("./NotificationService"));
class MaintenanceAlertService {
    constructor() {
        this.alertRepo = new MaintenanceAlertRepository_1.MaintenanceAlertRepository();
        this.bikeRepo = new BikeRepository_1.BikeRepository();
        this.notificationService = new NotificationService_1.default();
    }
    async createAlert(bikeId, data) {
        const alert = {
            id: (0, uuid_1.v4)(),
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
    async checkAndCreateMaintenanceAlerts(bikeId) {
        const bike = await this.bikeRepo.findById(bikeId);
        if (!bike) {
            throw new Error('Bike not found');
        }
        const alerts = [];
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
            const daysSinceLastMaintenance = Math.floor((Date.now() - bike.lastMaintenanceDate.getTime()) / (1000 * 60 * 60 * 24));
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
    async acknowledgeAlert(alertId, acknowledgedBy) {
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
    async resolveAlert(alertId, resolvedBy) {
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
    async getAlertsByBike(bikeId) {
        return await this.alertRepo.findByBikeId(bikeId);
    }
    async getActiveAlerts() {
        return await this.alertRepo.findActive();
    }
    async getCriticalAlerts() {
        return await this.alertRepo.findCriticalAlerts();
    }
    async getStatistics() {
        return await this.alertRepo.getStatistics();
    }
    async deleteAlert(alertId) {
        await this.alertRepo.delete(alertId);
    }
}
exports.MaintenanceAlertService = MaintenanceAlertService;
//# sourceMappingURL=MaintenanceAlertService.js.map