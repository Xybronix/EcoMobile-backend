// services/BikeService.ts
import { prisma } from '../config/prisma';
import { BikeStatus, Bike } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import GpsService from './GpsService';
import GooglePlacesService from './GooglePlacesService';

export interface CreateBikeDto {
  code: string;
  model: string;
  status?: BikeStatus;
  batteryLevel?: number;
  latitude?: number;
  longitude?: number;
  gpsDeviceId?: string;
  equipment?: string[];
}

export interface UpdateBikeDto {
  code?: string;
  model?: string;
  status?: BikeStatus;
  batteryLevel?: number;
  latitude?: number;
  longitude?: number;
  gpsDeviceId?: string;
  equipment?: string[];
}

export interface BikeFilter {
  status?: BikeStatus;
  minBatteryLevel?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

// Interface pour les zones/quartiers
export interface Area {
  key: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  country?: string;
  region?: string;
}

// Type étendu pour les vélos avec distance
export interface BikeWithDistance extends Bike {
  distance?: number | null;
}

export class BikeService {
  private gpsService: GpsService;
  private placesService: GooglePlacesService;

  constructor() {
    // Configuration GPS à récupérer depuis les variables d'environnement
    this.gpsService = new GpsService({
      baseUrl: process.env.GPS_API_URL || 'http://www.gpspos.net/Interface',
      username: process.env.GPS_USERNAME || '',
      password: process.env.GPS_PASSWORD || ''
    });

    this.placesService = new GooglePlacesService(
      process.env.GOOGLE_PLACES_API_KEY || ''
    );
  }

  /**
   * Create a new bike
   */
  async createBike(data: CreateBikeDto): Promise<Bike> {
    // Generate QR code
    const qrCode = `ECOMOBILE-${data.code}-${uuidv4()}`;

    const bike = await prisma.bike.create({
      data: {
        ...data,
        qrCode,
        status: data.status || BikeStatus.AVAILABLE,
        batteryLevel: data.batteryLevel || 100
      }
    });

    return bike;
  }

  /**
   * Get bike by ID
   */
  async getBikeById(id: string): Promise<Bike | null> {
    const bike = await prisma.bike.findUnique({
      where: { id },
      include: {
        maintenanceLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (bike) {
      // Synchroniser avec les données GPS si le vélo a un code GPS
      return await this.syncBikeWithGps(bike);
    }

    return bike;
  }

  /**
   * Get bike by code or QR code
   */
  async getBikeByCode(code: string): Promise<Bike | null> {
    const bike = await prisma.bike.findFirst({
      where: {
        OR: [
          { code },
          { qrCode: code }
        ]
      }
    });

    if (bike) {
      // Synchroniser avec les données GPS
      return await this.syncBikeWithGps(bike);
    }

    return bike;
  }

  /**
   * Get all bikes with filters
   */
  async getAllBikes(filter?: BikeFilter, page: number = 1, limit: number = 20) {
    const where: any = {};

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.minBatteryLevel !== undefined) {
      where.batteryLevel = { gte: filter.minBatteryLevel };
    }
    
    const skip = (page - 1) * limit;

    try {
      const [bikes, total] = await Promise.all([
        prisma.bike.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.bike.count({ where })
      ]);

      // Synchroniser tous les vélos avec les données GPS
      const syncedBikes = await this.syncBikesWithGps(bikes);

      // Si on a des coordonnées de référence, calculer les distances
      let bikesWithDistance: BikeWithDistance[] = syncedBikes.map(bike => ({ ...bike, distance: null }));
      
      if (filter?.latitude && filter?.longitude) {
        bikesWithDistance = syncedBikes.map(bike => ({
          ...bike,
          distance: bike.latitude && bike.longitude 
            ? this.calculateDistance(filter.latitude!, filter.longitude!, bike.latitude, bike.longitude)
            : null
        }));

        // Filtrer par rayon si spécifié
        if (filter.radiusKm) {
          bikesWithDistance = bikesWithDistance.filter(bike => 
            bike.distance != null && bike.distance <= filter.radiusKm!
          );
        }

        // Trier par distance
        bikesWithDistance.sort((a, b) => {
          const da = a.distance ?? Number.POSITIVE_INFINITY;
          const db = b.distance ?? Number.POSITIVE_INFINITY;
          if (da === db) return 0;
          return da - db;
        });
      }

      return {
        bikes: bikesWithDistance,
        pagination: {
          page: page,
          limit: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('BikeService.getAllBikes error:', error);
      throw error;
    }
  }

  /**
   * Get nearby bikes (within radius)
   */
  async getNearbyBikes(latitude: number, longitude: number, radiusKm: number = 2) {
    // Get all available bikes with coordinates
    const bikes = await prisma.bike.findMany({
      where: {
        status: BikeStatus.AVAILABLE,
        latitude: { not: undefined },
        longitude: { not: undefined }
      }
    });

    // Synchroniser avec les données GPS
    const syncedBikes = await this.syncBikesWithGps(bikes);

    // Définir un type pour les vélos avec des coordonnées non nulles
    type BikeWithCoordinates = Bike & {
      latitude: number;
      longitude: number;
    };

    // Filter bikes within radius using Haversine formula
    const nearbyBikes = syncedBikes.filter((bike): bike is BikeWithCoordinates => {
      return bike.latitude !== null && 
            bike.longitude !== null &&
            this.calculateDistance(latitude, longitude, bike.latitude, bike.longitude) <= radiusKm;
    });

    // Sort by distance
    nearbyBikes.sort((a, b) => {
      const distA = this.calculateDistance(latitude, longitude, a.latitude, a.longitude);
      const distB = this.calculateDistance(latitude, longitude, b.latitude, b.longitude);
      return distA - distB;
    });

    // Définir le type de retour avec distance
    type BikeWithDistanceResult = BikeWithCoordinates & {
      distance: number;
    };

    return nearbyBikes.map((bike): BikeWithDistanceResult => ({
      ...bike,
      distance: this.calculateDistance(latitude, longitude, bike.latitude, bike.longitude)
    }));
  }

  /**
   * Update bike
   */
  async updateBike(id: string, data: UpdateBikeDto): Promise<Bike> {
    return await prisma.bike.update({
      where: { id },
      data
    });
  }

  /**
   * Update bike location
   */
  async updateBikeLocation(id: string, latitude: number, longitude: number): Promise<Bike> {
    return await prisma.bike.update({
      where: { id },
      data: { latitude, longitude }
    });
  }

  /**
   * Update bike status
   */
  async updateBikeStatus(id: string, status: BikeStatus): Promise<Bike> {
    return await prisma.bike.update({
      where: { id },
      data: { status }
    });
  }

  /**
   * Update bike battery
   */
  async updateBikeBattery(id: string, batteryLevel: number): Promise<Bike> {
    return await prisma.bike.update({
      where: { id },
      data: { batteryLevel }
    });
  }

  /**
   * Delete bike
   */
  async deleteBike(id: string): Promise<void> {
    await prisma.bike.delete({
      where: { id }
    });
  }

  /**
   * Lock bike (set to available)
   */
  async lockBike(id: string): Promise<Bike> {
    const bike = await this.getBikeById(id);
    
    if (!bike) {
      throw new Error('Bike not found');
    }

    // Mettre à jour la position finale via GPS si le vélo a un code GPS
    if (bike.code) {
      try {
        const lastPosition = await this.gpsService.getLastPosition(bike.code);
        if (lastPosition) {
          await this.updateBikeLocation(id, lastPosition.dbLat, lastPosition.dbLon);
          await this.updateBikeBattery(id, this.gpsService.parseBatteryLevel(lastPosition.nFuel));
        }
      } catch (error) {
        console.warn(`Failed to update GPS data for bike ${id}:`, error);
      }
    }

    return await this.updateBikeStatus(id, BikeStatus.AVAILABLE);
  }

  /**
   * Unlock bike (set to in use)
   */
  async unlockBike(id: string): Promise<Bike> {
    const bike = await this.getBikeById(id);
    
    if (!bike) {
      throw new Error('Bike not found');
    }

    if (bike.status !== BikeStatus.AVAILABLE) {
      throw new Error('Bike is not available');
    }

    // Synchroniser avec GPS avant de déverrouiller
    if (bike.code) {
      try {
        const lastPosition = await this.gpsService.getLastPosition(bike.code);
        if (lastPosition) {
          await this.updateBikeLocation(id, lastPosition.dbLat, lastPosition.dbLon);
          await this.updateBikeBattery(id, this.gpsService.parseBatteryLevel(lastPosition.nFuel));
        }
      } catch (error) {
        console.warn(`Failed to sync GPS data for bike ${id}:`, error);
      }
    }

    return await this.updateBikeStatus(id, BikeStatus.IN_USE);
  }

  /**
   * Add maintenance log
   */
  async addMaintenanceLog(bikeId: string, data: {
    type: string;
    description: string;
    cost?: number;
    performedBy?: string;
  }) {
    return await prisma.maintenanceLog.create({
      data: {
        bikeId,
        ...data
      }
    });
  }

  /**
   * Get maintenance history
   */
  async getMaintenanceHistory(bikeId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.maintenanceLog.findMany({
        where: { bikeId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.maintenanceLog.count({
        where: { bikeId }
      })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get bike statistics
   */
  async getBikeStats(bikeId: string) {
    const [bike, ridesCount, totalDistance, totalRevenue] = await Promise.all([
      prisma.bike.findUnique({ where: { id: bikeId } }),
      prisma.ride.count({
        where: { bikeId, status: 'COMPLETED' }
      }),
      prisma.ride.aggregate({
        where: { bikeId, status: 'COMPLETED' },
        _sum: { distance: true }
      }),
      prisma.ride.aggregate({
        where: { bikeId, status: 'COMPLETED' },
        _sum: { cost: true }
      })
    ]);

    return {
      bike,
      totalRides: ridesCount,
      totalDistance: totalDistance._sum.distance || 0,
      totalRevenue: totalRevenue._sum.cost || 0
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // ========== NOUVELLES MÉTHODES GPS ET GOOGLE PLACES ==========

  /**
   * Synchroniser un vélo avec les données GPS
   */
  private async syncBikeWithGps(bike: Bike): Promise<Bike> {
    if (!bike.code) return bike;

    try {
      const lastPosition = await this.gpsService.getLastPosition(bike.code);
      
      if (lastPosition) {
        const newBatteryLevel = this.gpsService.parseBatteryLevel(lastPosition.nFuel);
        const needsUpdate = 
          bike.latitude !== lastPosition.dbLat ||
          bike.longitude !== lastPosition.dbLon ||
          bike.batteryLevel !== newBatteryLevel;

        if (needsUpdate) {
          const updatedBike = await prisma.bike.update({
            where: { id: bike.id },
            data: {
              latitude: lastPosition.dbLat,
              longitude: lastPosition.dbLon,
              batteryLevel: newBatteryLevel,
              updatedAt: new Date()
            }
          });
          return updatedBike;
        }
      }
    } catch (error) {
      console.warn(`Failed to sync GPS data for bike ${bike.id}:`, error);
    }

    return bike;
  }

  /**
   * Synchroniser plusieurs vélos avec les données GPS
   */
  private async syncBikesWithGps(bikes: Bike[]): Promise<Bike[]> {
    const syncedBikes: Bike[] = [];

    for (const bike of bikes) {
      const syncedBike = await this.syncBikeWithGps(bike);
      syncedBikes.push(syncedBike);
    }

    return syncedBikes;
  }

  /**
   * Forcer la synchronisation de tous les vélos avec GPS
   */
  async syncAllBikesWithGps(): Promise<void> {
    try {
      const bikes = await prisma.bike.findMany({
        where: {
          code: { not: undefined }
        }
      });

      await this.syncBikesWithGps(bikes);
    } catch (error) {
      console.error('Failed to sync all bikes with GPS:', error);
      throw error;
    }
  }

  /**
   * Rechercher des zones/quartiers via Google Places
   */
  async searchAreas(query: string, country: string = 'CM'): Promise<Area[]> {
    try {
      const areas = await this.placesService.searchPlaces(query, country);
      return areas.map(area => ({
        key: area.key,
        name: area.name,
        location: area.location,
        country: area.country,
        region: area.city
      }));
    } catch (error) {
      console.error('Error searching areas:', error);
      return [];
    }
  }

  /**
   * Obtenir les zones par défaut (Cameroun)
   */
  async getDefaultAreas(): Promise<Area[]> {
    const areas = this.placesService.getDefaultCameroonAreas();
    return areas.map(area => ({
      key: area.key,
      name: area.name,
      location: area.location,
      country: area.country,
      region: area.city
    }));
  }

  /**
   * Géocoding inversé pour obtenir une adresse
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      return await this.placesService.reverseGeocode(latitude, longitude);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return '';
    }
  }

  /**
   * Obtenir l'historique de trajet GPS d'un vélo
   */
  async getBikeTrack(bikeId: string, startTime: Date, endTime: Date): Promise<any[]> {
    const bike = await this.getBikeById(bikeId);
    
    if (!bike || !bike.code) {
      throw new Error('Bike not found or no GPS code');
    }

    try {
      const startTimeUnix = Math.floor(startTime.getTime() / 1000);
      const endTimeUnix = Math.floor(endTime.getTime() / 1000);
      
      const track = await this.gpsService.getTrack(bike.code, startTimeUnix, endTimeUnix);
      
      return track.map(point => ({
        timestamp: this.gpsService.convertUtcToLocalTime(point.nTime),
        latitude: point.dbLat,
        longitude: point.dbLon,
        speed: point.nSpeed,
        direction: point.nDirection,
        batteryLevel: this.gpsService.parseBatteryLevel(point.nFuel)
      }));
    } catch (error) {
      console.error('Failed to get bike track:', error);
      return [];
    }
  }

  /**
   * Obtenir le kilométrage d'un vélo sur une période
   */
  async getBikeMileage(bikeId: string, startTime: Date, endTime: Date): Promise<{
    startMileage: number;
    endMileage: number;
    totalMileage: number;
  } | null> {
    const bike = await this.getBikeById(bikeId);
    
    if (!bike || !bike.code) {
      throw new Error('Bike not found or no GPS code');
    }

    try {
      const startTimeUnix = Math.floor(startTime.getTime() / 1000);
      const endTimeUnix = Math.floor(endTime.getTime() / 1000);
      
      const mileage = await this.gpsService.getMileage(bike.code, startTimeUnix, endTimeUnix);
      
      if (!mileage) return null;

      return {
        startMileage: mileage.nStartMileage,
        endMileage: mileage.nEndMileage,
        totalMileage: mileage.nMileage
      };
    } catch (error) {
      console.error('Failed to get bike mileage:', error);
      return null;
    }
  }
}

export default new BikeService();