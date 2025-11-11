import { prisma } from '../config/prisma';
import { BikeStatus, Bike } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface CreateBikeDto {
  code: string;
  model: string;
  status?: BikeStatus;
  batteryLevel?: number;
  latitude?: number;
  longitude?: number;
}

export interface UpdateBikeDto {
  code?: string;
  model?: string;
  status?: BikeStatus;
  batteryLevel?: number;
  latitude?: number;
  longitude?: number;
}

export interface BikeFilter {
  status?: BikeStatus;
  minBatteryLevel?: number;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export class BikeService {
  /**
   * Create a new bike
   */
  async createBike(data: CreateBikeDto): Promise<Bike> {
    // Generate QR code
    const qrCode = `FREEBIKE-${data.code}-${uuidv4()}`;

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
    return await prisma.bike.findUnique({
      where: { id },
      include: {
        maintenanceLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
  }

  /**
   * Get bike by code or QR code
   */
  async getBikeByCode(code: string): Promise<Bike | null> {
    return await prisma.bike.findFirst({
      where: {
        OR: [
          { code },
          { qrCode: code }
        ]
      }
    });
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

      return {
        bikes,
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
        latitude: { not: null },
        longitude: { not: null }
      }
    });

    // Définir un type pour les vélos avec des coordonnées non nulles
    type BikeWithCoordinates = Bike & {
      latitude: number;
      longitude: number;
    };

    // Filter bikes within radius using Haversine formula
    const nearbyBikes = bikes.filter((bike): bike is BikeWithCoordinates => {
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
    type BikeWithDistance = BikeWithCoordinates & {
      distance: number;
    };

    return nearbyBikes.map((bike): BikeWithDistance => ({
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
}

export default new BikeService();
