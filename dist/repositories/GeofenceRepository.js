"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofenceRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class GeofenceRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('geofence_zones');
    }
    async findActiveZones() {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE active = true
      ORDER BY createdAt DESC
    `;
        const results = await this.db.query(query);
        return results.map((row) => this.mapToModel(row));
    }
    async findByType(type) {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE type = ? AND active = true
      ORDER BY createdAt DESC
    `;
        const results = await this.db.query(query, [type]);
        return results.map((row) => this.mapToModel(row));
    }
    // Check if a point is inside any geofence zone
    async findZonesContainingPoint(latitude, longitude) {
        const zones = await this.findActiveZones();
        return zones.filter(zone => {
            return this.isPointInPolygon({ latitude, longitude }, zone.coordinates);
        });
    }
    isPointInPolygon(point, polygon) {
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
            if (intersect)
                inside = !inside;
        }
        return inside;
    }
    mapToModel(row) {
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
exports.GeofenceRepository = GeofenceRepository;
//# sourceMappingURL=GeofenceRepository.js.map