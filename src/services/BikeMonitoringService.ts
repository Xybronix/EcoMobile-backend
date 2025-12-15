import { prisma } from '../config/prisma';
import { BikeStatus } from '@prisma/client';
import BikeService from './BikeService';
import NotificationService from './NotificationService';
import GpsService from './GpsService';

export interface SuspiciousMovement {
  bikeId: string;
  bikeCode: string;
  currentLocation: { lat: number; lng: number };
  lastKnownLocation: { lat: number; lng: number };
  movement: {
    distance: number;
    timeDetected: Date;
    isOutsideDepositZone: boolean;
  };
  status: 'AVAILABLE' | 'MAINTENANCE' | 'IN_USE' | 'UNAVAILABLE';
  lastRide?: {
    endTime: Date;
    userId: string;
    userName: string;
  };
}

class BikeMonitoringService {
  private gpsService: GpsService;
  private notificationService: NotificationService;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.gpsService = new GpsService({
      baseUrl: process.env.GPS_API_URL || '',
      username: process.env.GPS_USERNAME || '',
      password: process.env.GPS_PASSWORD || ''
    });
    this.notificationService = new NotificationService();
  }

  /**
   * Démarrer la surveillance des vélos
   */
  startMonitoring(intervalMs: number = 60000) { // Vérifier toutes les minutes
    this.monitoringInterval = setInterval(async () => {
      await this.checkSuspiciousMovements();
    }, intervalMs);

    console.log('Bike monitoring started with interval:', intervalMs);
  }

  /**
   * Arrêter la surveillance
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Bike monitoring stopped');
    }
  }

  /**
   * Vérifier les mouvements suspects
   */
  async checkSuspiciousMovements(): Promise<SuspiciousMovement[]> {
    try {
      const suspiciousBikes: SuspiciousMovement[] = [];

      // Récupérer tous les vélos disponibles et en maintenance
      const bikes = await prisma.bike.findMany({
        where: {
          status: { in: [BikeStatus.AVAILABLE, BikeStatus.MAINTENANCE] },
          code: { not: '' }
        }
      });

      for (const bike of bikes) {
        try {
          // Obtenir la position GPS actuelle
          const currentGpsPosition = await this.gpsService.getLastPosition(bike.code);
          
          if (!currentGpsPosition || !bike.latitude || !bike.longitude) {
            continue;
          }

          const currentLocation = {
            lat: currentGpsPosition.dbLat,
            lng: currentGpsPosition.dbLon
          };

          const lastKnownLocation = {
            lat: bike.latitude,
            lng: bike.longitude
          };

          // Calculer la distance de mouvement
          const distance = BikeService.calculateDistance(
            lastKnownLocation.lat,
            lastKnownLocation.lng,
            currentLocation.lat,
            currentLocation.lng
          );

          // Seuil de mouvement suspect (100 mètres)
          if (distance > 0.1) { // 100 mètres
            // Vérifier s'il y a un trajet actif pour ce vélo
            const activeRide = await prisma.ride.findFirst({
              where: {
                bikeId: bike.id,
                status: 'IN_PROGRESS'
              },
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            });

            // Si pas de trajet actif, c'est suspect
            if (!activeRide) {
              // Récupérer le dernier trajet pour contexte
              const lastRide = await prisma.ride.findFirst({
                where: { bikeId: bike.id },
                orderBy: { endTime: 'desc' },
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              });

              // Vérifier si le vélo est dans une zone de dépôt autorisée
              const isOutsideDepositZone = await this.checkIfOutsideDepositZone(currentLocation);

              const suspiciousMovement: SuspiciousMovement = {
                bikeId: bike.id,
                bikeCode: bike.code,
                currentLocation,
                lastKnownLocation,
                movement: {
                  distance: Math.round(distance * 1000), // en mètres
                  timeDetected: new Date(),
                  isOutsideDepositZone
                },
                status: bike.status,
                lastRide: lastRide ? {
                  endTime: lastRide.endTime!,
                  userId: lastRide.userId,
                  userName: `${lastRide.user.firstName} ${lastRide.user.lastName}`
                } : undefined
              };

              suspiciousBikes.push(suspiciousMovement);

              // Mettre à jour la position du vélo dans la DB
              await prisma.bike.update({
                where: { id: bike.id },
                data: {
                  latitude: currentLocation.lat,
                  longitude: currentLocation.lng,
                  updatedAt: new Date()
                }
              });

              // Envoyer l'alerte aux admins
              await this.sendSuspiciousMovementAlert(suspiciousMovement);
            }
          }

        } catch (error) {
          console.error(`Error checking bike ${bike.code}:`, error);
        }
      }

      return suspiciousBikes;
    } catch (error) {
      console.error('Error in checkSuspiciousMovements:', error);
      return [];
    }
  }

  /**
   * Vérifier si le vélo est en dehors d'une zone de dépôt
   */
  private async checkIfOutsideDepositZone(location: { lat: number; lng: number }): Promise<boolean> {
    // Récupérer les zones de dépôt autorisées
    const depositZones = await this.getDepositZones();
    
    // Vérifier si le vélo est dans au moins une zone
    for (const zone of depositZones) {
      const distance = BikeService.calculateDistance(
        location.lat,
        location.lng,
        zone.centerLat,
        zone.centerLng
      );
      
      if (distance <= zone.radiusKm) {
        return false; // Dans une zone autorisée
      }
    }
    
    return true; // En dehors de toutes les zones
  }

  /**
   * Obtenir les zones de dépôt autorisées
   */
  private async getDepositZones() {
    // Pour l'instant, zones par défaut. À terme, géré en DB
    return [
      { centerLat: 4.0511, centerLng: 9.7679, radiusKm: 2 }, // Douala centre
      { centerLat: 3.8480, centerLng: 11.5021, radiusKm: 2 }, // Yaoundé centre
    ];
  }

  /**
   * Envoyer une alerte de mouvement suspect aux admins
   */
  private async sendSuspiciousMovementAlert(movement: SuspiciousMovement) {
    const alertTitle = '🚨 ALERTE: Vélo en mouvement suspect';
    const alertMessage = `Le vélo ${movement.bikeCode} se déplace sans trajet actif!
    
📍 Distance: ${movement.movement.distance}m
🕐 Détecté: ${movement.movement.timeDetected.toLocaleString()}
🗺️ Hors zone: ${movement.movement.isOutsideDepositZone ? 'OUI' : 'NON'}
${movement.lastRide ? `👤 Dernier utilisateur: ${movement.lastRide.userName} (${movement.lastRide.endTime.toLocaleString()})` : '👤 Aucun historique récent'}

INTERVENTION URGENTE REQUISE!`;

    // Notifier tous les admins
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: true
      }
    });

    for (const admin of admins) {
      await this.notificationService.createNotification({
        userId: admin.id,
        title: alertTitle,
        message: alertMessage,
        type: 'SECURITY_ALERT'
      });
    }

    // Log dans les activity logs
    await prisma.activityLog.create({
      data: {
        action: 'ALERT',
        resource: 'BIKE_SECURITY',
        resourceId: movement.bikeId,
        details: alertTitle
      }
    });

    console.log(`SECURITY ALERT: Bike ${movement.bikeCode} moving suspiciously`);
  }

  /**
   * Marquer une alerte comme traitée
   */
  async markAlertAsHandled(bikeId: string, adminId: string, action: string, note?: string) {
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'RESOLVE_ALERT',
        resource: 'BIKE_SECURITY',
        resourceId: bikeId,
        details: `Admin handled security alert: ${action}`,
        metadata: {
          adminAction: action,
          adminNote: note,
          resolvedAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Obtenir les alertes de sécurité récentes
   */
  async getRecentSecurityAlerts(limit: number = 50) {
    return await prisma.activityLog.findMany({
      where: {
        resource: 'BIKE_SECURITY',
        action: { in: ['ALERT', 'RESOLVE_ALERT'] }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}

export default new BikeMonitoringService();