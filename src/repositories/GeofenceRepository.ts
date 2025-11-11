import { BaseRepository } from './BaseRepository';
import { GeofenceZone } from '../models/types';

export class GeofenceRepository extends BaseRepository<GeofenceZone> {
  constructor() {
    super('geofence_zones');
  }

  async findActiveZones(): Promise<GeofenceZone[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE active = true
      ORDER BY createdAt DESC
    `;
    const results = await this.db.query(query);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByType(type: string): Promise<GeofenceZone[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE type = ? AND active = true
      ORDER BY createdAt DESC
    `;
    const results = await this.db.query(query, [type]);
    return results.map((row: any) => this.mapToModel(row));
  }

  // Check if a point is inside any geofence zone
  async findZonesContainingPoint(latitude: number, longitude: number): Promise<GeofenceZone[]> {
    const zones = await this.findActiveZones();
    
    return zones.filter(zone => {
      return this.isPointInPolygon(
        { latitude, longitude },
        zone.coordinates
      );
    });
  }

  private isPointInPolygon(
    point: { latitude: number; longitude: number },
    polygon: Array<{ latitude: number; longitude: number }>
  ): boolean {
    let inside = false;
    const x = point.latitude;
    const y = point.longitude;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].latitude;
      const yi = polygon[i].longitude;
      const xj = polygon[j].latitude;
      const yj = polygon[j].longitude;

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }

    return inside;
  }

  protected mapToModel(row: any): GeofenceZone {
    return {
      ...row,
      coordinates: row.coordinates ? JSON.parse(row.coordinates) : [],
      rules: row.rules ? JSON.parse(row.rules) : undefined,
      active: Boolean(row.active),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}
