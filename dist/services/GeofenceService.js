"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofenceService = void 0;
const GeofenceRepository_1 = require("../repositories/GeofenceRepository");
const uuid_1 = require("uuid");
class GeofenceService {
    constructor() {
        this.geofenceRepo = new GeofenceRepository_1.GeofenceRepository();
    }
    async createZone(data) {
        const zone = {
            ...data,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return await this.geofenceRepo.create(zone);
    }
    async updateZone(id, updates) {
        const updated = await this.geofenceRepo.update(id, {
            ...updates,
            updatedAt: new Date()
        });
        if (!updated) {
            throw new Error('Update zone not found');
        }
        return updated;
    }
    async deleteZone(id) {
        await this.geofenceRepo.delete(id);
    }
    async getZoneById(id) {
        return await this.geofenceRepo.findById(id);
    }
    async getAllZones() {
        return await this.geofenceRepo.findAll({});
    }
    async getActiveZones() {
        return await this.geofenceRepo.findActiveZones();
    }
    async getZonesByType(type) {
        return await this.geofenceRepo.findByType(type);
    }
    async checkLocation(latitude, longitude) {
        const zones = await this.geofenceRepo.findZonesContainingPoint(latitude, longitude);
        const violations = [];
        zones.forEach(zone => {
            if (zone.type === 'restricted' && zone.rules?.ridingAllowed === false) {
                violations.push({
                    zone,
                    violation: 'Riding not allowed in this zone',
                    penalty: zone.rules?.penalty
                });
            }
            if (zone.type === 'slow_zone' && zone.rules?.maxSpeed) {
                violations.push({
                    zone,
                    violation: `Speed limit ${zone.rules.maxSpeed} km/h in this zone`,
                    penalty: zone.rules?.penalty
                });
            }
        });
        return { zones, violations };
    }
    async isLocationInServiceArea(latitude, longitude) {
        const serviceAreas = await this.geofenceRepo.findByType('service_area');
        if (serviceAreas.length === 0) {
            // If no service areas defined, allow everywhere
            return true;
        }
        const zones = await this.geofenceRepo.findZonesContainingPoint(latitude, longitude);
        return zones.some(zone => zone.type === 'service_area');
    }
    async canParkAtLocation(latitude, longitude) {
        const zones = await this.geofenceRepo.findZonesContainingPoint(latitude, longitude);
        // Check if location is in restricted area
        const restrictedZone = zones.find(zone => zone.type === 'restricted' && zone.rules?.parkingAllowed === false);
        if (restrictedZone) {
            return {
                allowed: false,
                reason: `Parking not allowed in ${restrictedZone.name}`
            };
        }
        // Check if location is in designated parking zone
        const parkingZone = zones.find(zone => zone.type === 'parking');
        if (parkingZone) {
            return { allowed: true };
        }
        // Check if parking is required in designated zones
        const serviceArea = zones.find(zone => zone.type === 'service_area');
        if (serviceArea && serviceArea.rules?.parkingAllowed === false) {
            return {
                allowed: false,
                reason: 'Must park in designated parking zones'
            };
        }
        return { allowed: true };
    }
}
exports.GeofenceService = GeofenceService;
//# sourceMappingURL=GeofenceService.js.map