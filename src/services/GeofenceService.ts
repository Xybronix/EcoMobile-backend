import { GeofenceRepository } from '../repositories/GeofenceRepository';
import { GeofenceZone } from '../models/types';
import { randomUUID } from 'crypto';

export class GeofenceService {
  private geofenceRepo: GeofenceRepository;

  constructor() {
    this.geofenceRepo = new GeofenceRepository();
  }

  async createZone(
    data: Omit<GeofenceZone, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GeofenceZone> {
    const zone: GeofenceZone = {
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.geofenceRepo.create(zone);
  }

  async updateZone(id: string, updates: Partial<GeofenceZone>): Promise<GeofenceZone> {
    const updated = await this.geofenceRepo.update(id, {
      ...updates,
      updatedAt: new Date()
    });

    if (!updated) {
      throw new Error('Update zone not found');
    }

    return updated;
  }

  async deleteZone(id: string): Promise<void> {
    await this.geofenceRepo.delete(id);
  }

  async getZoneById(id: string): Promise<GeofenceZone | null> {
    return await this.geofenceRepo.findById(id);
  }

  async getAllZones(): Promise<GeofenceZone[]> {
    return await this.geofenceRepo.findAll({});
  }

  async getActiveZones(): Promise<GeofenceZone[]> {
    return await this.geofenceRepo.findActiveZones();
  }

  async getZonesByType(type: string): Promise<GeofenceZone[]> {
    return await this.geofenceRepo.findByType(type);
  }

  async checkLocation(
    latitude: number,
    longitude: number
  ): Promise<{
    zones: GeofenceZone[];
    violations: Array<{
      zone: GeofenceZone;
      violation: string;
      penalty?: number;
    }>;
  }> {
    const zones = await this.geofenceRepo.findZonesContainingPoint(latitude, longitude);
    const violations: Array<{
      zone: GeofenceZone;
      violation: string;
      penalty?: number;
    }> = [];

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

  async isLocationInServiceArea(latitude: number, longitude: number): Promise<boolean> {
    const serviceAreas = await this.geofenceRepo.findByType('service_area');
    
    if (serviceAreas.length === 0) {
      // If no service areas defined, allow everywhere
      return true;
    }

    const zones = await this.geofenceRepo.findZonesContainingPoint(latitude, longitude);
    return zones.some(zone => zone.type === 'service_area');
  }

  async canParkAtLocation(latitude: number, longitude: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const zones = await this.geofenceRepo.findZonesContainingPoint(latitude, longitude);

    // Check if location is in restricted area
    const restrictedZone = zones.find(
      zone => zone.type === 'restricted' && zone.rules?.parkingAllowed === false
    );
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
