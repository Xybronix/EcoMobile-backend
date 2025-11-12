import { GeofenceZone } from '../models/types';
export declare class GeofenceService {
    private geofenceRepo;
    constructor();
    createZone(data: Omit<GeofenceZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeofenceZone>;
    updateZone(id: string, updates: Partial<GeofenceZone>): Promise<GeofenceZone>;
    deleteZone(id: string): Promise<void>;
    getZoneById(id: string): Promise<GeofenceZone | null>;
    getAllZones(): Promise<GeofenceZone[]>;
    getActiveZones(): Promise<GeofenceZone[]>;
    getZonesByType(type: string): Promise<GeofenceZone[]>;
    checkLocation(latitude: number, longitude: number): Promise<{
        zones: GeofenceZone[];
        violations: Array<{
            zone: GeofenceZone;
            violation: string;
            penalty?: number;
        }>;
    }>;
    isLocationInServiceArea(latitude: number, longitude: number): Promise<boolean>;
    canParkAtLocation(latitude: number, longitude: number): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
}
//# sourceMappingURL=GeofenceService.d.ts.map