import { prisma } from '../config/prisma';
import { BikeStatus, Bike } from '@prisma/client';
import { randomUUID } from 'crypto';
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
  isActive?: boolean;
  hasPricingPlan?: boolean;
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
    const qrCode = `ECOMOBILE-${data.code}-${randomUUID()}`;

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
  async getBikeById(id: string): Promise<any | null> {
    const bike = await prisma.bike.findUnique({
      where: { id },
      include: {
        maintenanceLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        pricingPlan: {
          include: {
            pricingConfig: true,
            promotions: {
              where: {
                promotion: {
                  isActive: true,
                  startDate: { lte: new Date() },
                  endDate: { gte: new Date() }
                }
              },
              include: {
                promotion: true
              }
            }
          }
        }
      }
    });

    if (!bike) return null;

    // Synchroniser avec GPS
    const syncedBike = await this.syncBikeWithGps(bike);
    
    // Ajouter les informations de pricing
    const currentPricing = await this.calculateCurrentPricing(syncedBike);
    
    return {
      ...syncedBike,
      currentPricing
    };
  }

  /**
   * Get bike by code or QR code
   */
  async getBikeByCode(code: string): Promise<any | null> {
    const bike = await prisma.bike.findFirst({
      where: {
        OR: [
          { code },
          { qrCode: code }
        ]
      },
      include: {
        pricingPlan: {
          include: {
            pricingConfig: true,
            promotions: {
              where: {
                promotion: {
                  isActive: true,
                  startDate: { lte: new Date() },
                  endDate: { gte: new Date() }
                }
              },
              include: {
                promotion: true
              }
            }
          }
        }
      }
    });

    if (!bike) return null;

    // Synchroniser avec GPS
    const syncedBike = await this.syncBikeWithGps(bike);
    
    // Ajouter les informations de pricing
    const currentPricing = await this.calculateCurrentPricing(syncedBike);
    
    return {
      ...syncedBike,
      currentPricing
    };
  }

  /**
   * Get bike with current pricing
   */
  async getBikeWithPricing(id: string): Promise<any> {
    const bike = await prisma.bike.findUnique({
      where: { id },
      include: {
        pricingPlan: {
          include: {
            pricingConfig: true,
            promotions: {
              where: {
                promotion: {
                  isActive: true,
                  startDate: { lte: new Date() },
                  endDate: { gte: new Date() }
                }
              },
              include: {
                promotion: true
              }
            }
          }
        }
      }
    });

    if (!bike || !bike.pricingPlan) {
      return null; // Vélo non trouvé ou pas de plan tarifaire
    }

    // Calculer le prix actuel avec règles et promotions
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay();

    // Trouver les règles applicables
    const rules = await prisma.pricingRule.findMany({
      where: {
        pricingConfigId: bike.pricingPlan.pricingConfigId || '',
        isActive: true,
        OR: [
          { dayOfWeek: null },
          { dayOfWeek: dayOfWeek }
        ]
      },
      orderBy: { priority: 'desc' }
    });

    const applicableRule = rules.find(rule => {
      if (rule.startHour !== null && rule.endHour !== null) {
        if (rule.startHour <= rule.endHour) {
          return currentHour >= rule.startHour && currentHour < rule.endHour;
        } else {
          return currentHour >= rule.startHour || currentHour < rule.endHour;
        }
      }
      return true;
    });

    const multiplier = applicableRule?.multiplier || 1;
    let finalHourlyRate = Math.round(bike.pricingPlan.hourlyRate * multiplier);

    // Appliquer les promotions
    const activePromotions = bike.pricingPlan.promotions
      .map(pp => pp.promotion)
      .filter(p => p.isActive);

    let appliedPromotions: any[] = [];
    
    activePromotions.forEach(promotion => {
      if (promotion.usageLimit === null || promotion.usageCount < promotion.usageLimit) {
        if (promotion.discountType === 'PERCENTAGE') {
          const discountAmount = promotion.discountValue / 100;
          finalHourlyRate = Math.round(finalHourlyRate * (1 - discountAmount));
        } else {
          finalHourlyRate = Math.max(0, finalHourlyRate - promotion.discountValue);
        }
        appliedPromotions.push(promotion);
      }
    });

    return {
      ...bike,
      currentPricing: {
        hourlyRate: finalHourlyRate,
        originalHourlyRate: bike.pricingPlan.hourlyRate,
        unlockFee: bike.pricingPlan.pricingConfig?.unlockFee || 0,
        appliedRule: applicableRule,
        appliedPromotions,
        pricingPlan: bike.pricingPlan
      }
    };
  }

  /**
   * Get all bikes with filters
   */
  async getAllBikes(filter?: BikeFilter & { isActive?: boolean; hasPricingPlan?: boolean }, page: number = 1, limit: number = 20) {
    const where: any = {};

    // Filtrage selon le contexte (admin vs public)
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter?.hasPricingPlan) {
      where.pricingPlanId = { not: null };
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const reservedBikeIds = await prisma.reservation.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            startDate: { lte: tomorrow },
            endDate: { gte: new Date() }
          },
          {
            packageType: 'monthly',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          }
        ]
      },
      select: { bikeId: true }
    });

    if (reservedBikeIds.length > 0) {
      where.id = { notIn: reservedBikeIds.map(r => r.bikeId) };
    }

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
          orderBy: { createdAt: 'desc' },
          include: {
            pricingPlan: {
              include: {
                pricingConfig: true,
                promotions: {
                  where: {
                    promotion: {
                      isActive: true,
                      startDate: { lte: new Date() },
                      endDate: { gte: new Date() }
                    }
                  },
                  include: {
                    promotion: true
                  }
                }
              }
            }
          }
        }),
        prisma.bike.count({ where })
      ]);

      // Synchroniser avec GPS seulement les vélos avec gpsDeviceId
      const syncedBikes = await Promise.all(
        bikes.map(async (bike) => {
          if (bike.gpsDeviceId) {
            try {
              return await this.syncBikeWithGps(bike);
            } catch (error) {
              console.warn(`Failed to sync GPS for bike ${bike.id}:`, error);
              return bike;
            }
          }
          return bike;
        })
      );

      // Ajouter le pricing et les métadonnées
      const bikesWithEnhancements = await Promise.all(
        syncedBikes.map(async (bike) => {
          const currentPricing = await this.calculateCurrentPricing(bike);
          return {
            ...bike,
            currentPricing,
            isGpsEnabled: !!bike.gpsDeviceId,
            isOnline: bike.gpsDeviceId ? await this.isDeviceOnline(bike.gpsDeviceId) : false
          };
        })
      );

      // Définir le type étendu avec distance
      type BikeWithDistance = typeof bikesWithEnhancements[0] & { distance?: number | null };
      
      // Calculer les distances si coordonnées de référence fournies
      let finalBikes: BikeWithDistance[] = bikesWithEnhancements.map(bike => {
        let distance: number | null = null;
        
        if (filter?.latitude && filter?.longitude && bike.latitude && bike.longitude) {
          distance = this.calculateDistance(filter.latitude, filter.longitude, bike.latitude, bike.longitude);
        }
        
        return {
          ...bike,
          distance
        };
      });

      // Filtrer par rayon si spécifié
      if (filter?.radiusKm && filter?.latitude && filter?.longitude) {
        finalBikes = finalBikes.filter(bike => 
          typeof bike.distance === 'number' && bike.distance <= filter.radiusKm!
        );
      }

      // Trier par distance si disponible
      if (filter?.latitude && filter?.longitude) {
        finalBikes.sort((a, b) => {
          const distanceA = a.distance ?? Number.POSITIVE_INFINITY;
          const distanceB = b.distance ?? Number.POSITIVE_INFINITY;
          return distanceA - distanceB;
        });
      }

      return {
        bikes: finalBikes,
        pagination: {
          page: page,
          limit: limit,
          total: filter?.radiusKm ? finalBikes.length : total,
          totalPages: Math.ceil((filter?.radiusKm ? finalBikes.length : total) / limit)
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
   * Mettre un vélo en mode maintenance
   */
  async setMaintenanceMode(bikeId: string, reason: string): Promise<Bike> {
    const bike = await prisma.bike.update({
      where: { id: bikeId },
      data: { 
        status: BikeStatus.MAINTENANCE,
        updatedAt: new Date()
      }
    });

    // Créer un log de maintenance
    await prisma.maintenanceLog.create({
      data: {
        bikeId,
        type: 'SECURITY_MAINTENANCE',
        description: reason,
        performedBy: 'SYSTEM'
      }
    });

    return bike;
  }

  /**
   * Sortir un vélo du mode maintenance (admin seulement)
   */
  async removeMaintenanceMode(bikeId: string, adminId: string, note?: string): Promise<Bike> {
    const bike = await prisma.bike.update({
      where: { id: bikeId },
      data: { 
        status: BikeStatus.AVAILABLE,
        lastMaintenanceAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Créer un log de fin de maintenance
    await prisma.maintenanceLog.create({
      data: {
        bikeId,
        type: 'MAINTENANCE_COMPLETED',
        description: note || 'Vélo remis en service',
        performedBy: adminId
      }
    });

    return bike;
  }

  /**
   * Obtenir le vélo réservé par un utilisateur
   */
  async getUserReservedBike(userId: string): Promise<any | null> {
    const activeReservation = await prisma.reservation.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: {
        bike: true,
        plan: true
      }
    });

    return activeReservation?.bike || null;
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
    if (!bike.gpsDeviceId) return bike;

    try {
      const lastPosition = await this.gpsService.getLastPosition(bike.gpsDeviceId);
      
      if (lastPosition) {
        const newBatteryLevel = this.gpsService.parseBatteryLevel(lastPosition.nFuel);
        const gpsSignal = this.gpsService.parseGpsSignal(lastPosition.nGPSSignal);
        const gsmSignal = this.gpsService.parseGsmSignal(lastPosition.nGSMSignal);
        const speed = lastPosition.nSpeed;
        
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
          
          return {
            ...updatedBike,
            gpsSignal,
            gsmSignal,
            speed,
            lastGpsUpdate: this.gpsService.convertUtcToLocalTime(lastPosition.nTime)
          } as Bike;
        }
        
        return {
          ...bike,
          gpsSignal,
          gsmSignal,
          speed,
          lastGpsUpdate: this.gpsService.convertUtcToLocalTime(lastPosition.nTime)
        } as Bike;
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
  async syncAllBikesWithGps(): Promise<{
    synced: number;
    failed: number;
    bikes: any[];
  }> {
    try {
      const bikes = await prisma.bike.findMany({
        where: {
          gpsDeviceId: { not: null }
        }
      });

      const results = [];
      let synced = 0;
      let failed = 0;

      for (const bike of bikes) {
        try {
          const syncedBike = await this.syncBikeWithGps(bike);
          const isOnline = await this.isDeviceOnline(bike.gpsDeviceId!);
          
          results.push({
            ...syncedBike,
            isOnline,
            syncStatus: 'success'
          });
          synced++;
        } catch (error) {
          results.push({
            ...bike,
            isOnline: false,
            syncStatus: 'failed',
            syncError: error instanceof Error ? error.message : 'Unknown error'
          });
          failed++;
        }
      }

      return {
        synced,
        failed,
        bikes: results
      };
    } catch (error) {
      console.error('Failed to sync all bikes with GPS:', error);
      throw error;
    }
  }

  /**
   * Obtenir les positions en temps réel de tous les vélos GPS
   */
  async getRealtimePositions(): Promise<any[]> {
    try {
      const bikes = await prisma.bike.findMany({
        where: {
          gpsDeviceId: { not: null }
        },
        include: {
          pricingPlan: true
        }
      });

      const positions = await Promise.all(
        bikes.map(async (bike) => {
          try {
            const lastPosition = await this.gpsService.getLastPosition(bike.gpsDeviceId!);
            const isOnline = await this.isDeviceOnline(bike.gpsDeviceId!);
            
            if (lastPosition) {
              await prisma.bike.update({
                where: { id: bike.id },
                data: {
                  latitude: lastPosition.dbLat,
                  longitude: lastPosition.dbLon,
                  batteryLevel: this.gpsService.parseBatteryLevel(lastPosition.nFuel),
                  updatedAt: new Date()
                }
              });

              return {
                id: bike.id,
                code: bike.code,
                model: bike.model,
                status: bike.status,
                isActive: bike.isActive || true,
                gpsDeviceId: bike.gpsDeviceId,
                latitude: lastPosition.dbLat,
                longitude: lastPosition.dbLon,
                batteryLevel: this.gpsService.parseBatteryLevel(lastPosition.nFuel),
                gpsSignal: this.gpsService.parseGpsSignal(lastPosition.nGPSSignal),
                gsmSignal: this.gpsService.parseGsmSignal(lastPosition.nGSMSignal),
                speed: lastPosition.nSpeed,
                direction: lastPosition.nDirection,
                isOnline,
                lastGpsUpdate: this.gpsService.convertUtcToLocalTime(lastPosition.nTime),
                locationName: bike.locationName,
                equipment: bike.equipment,
                pricingPlan: bike.pricingPlan,
                deviceStatus: this.gpsService.parseDeviceStatus(lastPosition.nTEState),
                carState: this.gpsService.parseCarState(lastPosition.nCarState),
                alarmState: lastPosition.nAlarmState,
                mileage: lastPosition.nMileage,
                temperature: lastPosition.nTemp
              };
            } else {
              return {
                id: bike.id,
                code: bike.code,
                model: bike.model,
                status: bike.status,
                isActive: bike.isActive || true,
                gpsDeviceId: bike.gpsDeviceId,
                latitude: bike.latitude,
                longitude: bike.longitude,
                batteryLevel: bike.batteryLevel,
                gpsSignal: 0,
                gsmSignal: 0,
                speed: 0,
                direction: 0,
                isOnline: false,
                lastGpsUpdate: null,
                locationName: bike.locationName,
                equipment: bike.equipment,
                pricingPlan: bike.pricingPlan,
                deviceStatus: 'offline',
                syncError: 'No GPS data available'
              };
            }
          } catch (error) {
            console.error(`Failed to get position for bike ${bike.id}:`, error);
            return {
              id: bike.id,
              code: bike.code,
              model: bike.model,
              status: bike.status,
              isActive: bike.isActive || true,
              gpsDeviceId: bike.gpsDeviceId,
              latitude: bike.latitude,
              longitude: bike.longitude,
              batteryLevel: bike.batteryLevel,
              isOnline: false,
              lastGpsUpdate: null,
              locationName: bike.locationName,
              equipment: bike.equipment,
              pricingPlan: bike.pricingPlan,
              deviceStatus: 'error',
              syncError: error instanceof Error ? error.message : 'GPS sync failed'
            };
          }
        })
      );

      return positions;
    } catch (error) {
      console.error('Failed to get realtime positions:', error);
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

  /**
   * Calculer le pricing actuel pour un vélo
   */
  private async calculateCurrentPricing(bike: any): Promise<any | null> {
    if (!bike.pricingPlan) {
      // Récupérer un plan par défaut si le vélo n'en a pas
      const defaultPlan = await prisma.pricingPlan.findFirst({
        where: { 
          isActive: true,
          pricingConfig: { isActive: true }
        },
        include: {
          pricingConfig: true,
          promotions: {
            where: {
              promotion: {
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() }
              }
            },
            include: {
              promotion: true
            }
          }
        }
      });
      
      if (!defaultPlan) return null;
      bike.pricingPlan = defaultPlan;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay();

    // Trouver les règles applicables
    const rules = await prisma.pricingRule.findMany({
      where: {
        pricingConfigId: bike.pricingPlan.pricingConfig.id,
        isActive: true,
        OR: [
          { dayOfWeek: null },
          { dayOfWeek: dayOfWeek }
        ]
      },
      orderBy: { priority: 'desc' }
    });

    const applicableRule = rules.find(rule => {
      if (rule.startHour !== null && rule.endHour !== null) {
        if (rule.startHour <= rule.endHour) {
          return currentHour >= rule.startHour && currentHour < rule.endHour;
        } else {
          return currentHour >= rule.startHour || currentHour < rule.endHour;
        }
      }
      return true;
    });

    const multiplier = applicableRule?.multiplier || 1;
    let finalHourlyRate = Math.round(bike.pricingPlan.hourlyRate * multiplier);

    // Appliquer les promotions
    const activePromotions = bike.pricingPlan.promotions
      ?.map((pp: any) => pp.promotion)
      ?.filter((p: any) => p?.isActive) || [];

    let appliedPromotions: any[] = [];
    
    activePromotions.forEach((promotion: any) => {
      if (promotion.usageLimit === null || promotion.usageCount < promotion.usageLimit) {
        if (promotion.discountType === 'PERCENTAGE') {
          const discountAmount = promotion.discountValue / 100;
          finalHourlyRate = Math.round(finalHourlyRate * (1 - discountAmount));
        } else {
          finalHourlyRate = Math.max(0, finalHourlyRate - promotion.discountValue);
        }
        appliedPromotions.push(promotion);
      }
    });

    return {
      hourlyRate: finalHourlyRate,
      originalHourlyRate: bike.pricingPlan.hourlyRate,
      unlockFee: bike.pricingPlan.pricingConfig.unlockFee,
      appliedRule: applicableRule,
      appliedPromotions,
      pricingPlan: bike.pricingPlan
    };
  }

  /**
   * Vérifier si un dispositif GPS est en ligne
   */
  private async isDeviceOnline(gpsDeviceId: string): Promise<boolean> {
    try {
      const lastPosition = await this.gpsService.getLastPosition(gpsDeviceId);
      if (!lastPosition) return false;

      // Considérer comme en ligne si la dernière position date de moins de 30 minutes
      const lastUpdate = this.gpsService.convertUtcToLocalTime(lastPosition.nTime);
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      return lastUpdate > thirtyMinutesAgo;
    } catch (error) {
      return false;
    }
  }
}

export default new BikeService();