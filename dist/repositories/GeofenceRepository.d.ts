import { BaseRepository } from './BaseRepository';
import { GeofenceZone } from '../models/types';
export declare class GeofenceRepository extends BaseRepository<GeofenceZone> {
    constructor();
    findActiveZones(): Promise<GeofenceZone[]>;
    findByType(type: string): Promise<GeofenceZone[]>;
    findZonesContainingPoint(latitude: number, longitude: number): Promise<GeofenceZone[]>;
    private isPointInPolygon;
    protected mapToModel(row: any): GeofenceZone;
}
//# sourceMappingURL=GeofenceRepository.d.ts.map