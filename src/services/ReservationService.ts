// services/ReservationService.ts
import { prisma } from '../config/prisma';
import BikeRequestService from './BikeRequestService';
import NotificationService from './NotificationService';

export interface CreateReservationDto {
  userId: string;
  bikeId: string;
  planId: string;
  packageType: string;
  startDate: Date;
  startTime: string;
  endDate?: Date;
}

export class ReservationService {
  private bikeRequestService: typeof BikeRequestService;
  private notificationService: NotificationService;

  constructor() {
    this.bikeRequestService = BikeRequestService;
    this.notificationService = new NotificationService();
  }

  /**
   * Créer une nouvelle réservation
   */
  async createReservation(data: CreateReservationDto): Promise<any> {
    // Vérifier si le vélo existe et est disponible
    const bike = await prisma.bike.findUnique({
      where: { id: data.bikeId },
      include: { pricingPlan: true }
    });

    if (!bike) {
      throw new Error('Vélo non trouvé');
    }

    if (bike.status !== 'AVAILABLE') {
      throw new Error('Vélo non disponible');
    }

    // Calculer endDate basé sur packageType
    const startDateTime = new Date(`${data.startDate.toISOString().split('T')[0]}T${data.startTime}:00`);
    let endDateTime = new Date(startDateTime);
    
    if (data.packageType === 'monthly') {
      endDateTime.setMonth(endDateTime.getMonth() + 1);
    } else if (data.packageType === 'weekly') {
      endDateTime.setDate(endDateTime.getDate() + 7);
    } else {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    // Vérifier les collisions de réservation
    const conflict = await this.checkReservationConflict(data.bikeId, startDateTime, endDateTime);

    if (conflict) {
      throw new Error('Une réservation existe déjà pour cette période');
    }

    // Vérifier la caution de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { wallet: true }
    });

    const requiredDeposit = await this.getRequiredDeposit();
    if (!user || user.depositBalance < requiredDeposit) {
      throw new Error(`Caution insuffisante. Minimum requis: ${requiredDeposit} FCFA`);
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: data.userId,
        bikeId: data.bikeId,
        planId: data.planId,
        packageType: data.packageType,
        startDate: startDateTime,
        endDate: endDateTime,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        bike: true,
        plan: true
      }
    });

    // Créer l'abonnement si c'est mensuel
    if (data.packageType === 'monthly') {
      await prisma.subscription.create({
        data: {
          userId: data.userId,
          planId: data.planId,
          type: 'MONTHLY',
          startDate: startDateTime,
          endDate: endDateTime
        }
      });
    }

    // Notification pour l'utilisateur
    await this.notificationService.createNotification({
      userId: data.userId,
      title: 'Réservation confirmée',
      message: `Votre réservation pour le vélo ${bike.code} a été confirmée pour le ${data.startDate.toLocaleDateString()} à ${data.startTime}`,
      type: 'RESERVATION'
    });

    return reservation;
  }

  /**
   * Vérifier les conflits de réservation
   */
  async checkReservationConflict(bikeId: string, startDate: Date, endDate: Date): Promise<any> {
    return await prisma.reservation.findFirst({
      where: {
        bikeId,
        status: 'ACTIVE',
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } }
            ]
          }
        ]
      }
    });
  }

  /**
   * Obtenir les réservations d'un utilisateur
   */
  async getUserReservations(userId: string, status?: string) {
    const where: any = { userId };
    if (status) where.status = status;

    return await prisma.reservation.findMany({
      where,
      include: {
        bike: true,
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Modifier une réservation
   */
  async updateReservation(reservationId: string, userId: string, data: Partial<CreateReservationDto>) {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, userId }
    });

    if (!reservation || reservation.status !== 'ACTIVE') {
      throw new Error('Réservation non trouvée ou non modifiable');
    }

    let updateData: any = {};

    if (data.startDate && data.startTime) {
      const newStartDate = new Date(`${data.startDate.toISOString().split('T')[0]}T${data.startTime}:00`);
      let newEndDate = new Date(newStartDate);

      if (data.packageType === 'monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else if (data.packageType === 'weekly') {
        newEndDate.setDate(newEndDate.getDate() + 7);
      } else {
        newEndDate.setDate(newEndDate.getDate() + 1);
      }

      // Vérifier les nouvelles collisions
      const conflict = await this.checkReservationConflict(
        data.bikeId || reservation.bikeId,
        newStartDate,
        newEndDate
      );

      if (conflict && conflict.id !== reservationId) {
        throw new Error('Conflit avec une autre réservation');
      }

      updateData.startDate = newStartDate;
      updateData.endDate = newEndDate;
    }

    if (data.planId) updateData.planId = data.planId;
    if (data.packageType) updateData.packageType = data.packageType;

    return await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
      include: {
        bike: true,
        plan: true
      }
    });
  }

  /**
   * Annuler une réservation
   */
  async cancelReservation(reservationId: string, userId: string) {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, userId }
    });

    if (!reservation) {
      throw new Error('Réservation non trouvée');
    }

    return await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' }
    });
  }

  /**
   * Obtenir toutes les réservations (admin)
   */
  async getAllReservations(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        include: {
          user: { 
            select: { 
              id: true, 
              firstName: true, 
              lastName: true, 
              email: true 
            } 
          },
          bike: {
            select: {
              id: true,
              code: true,
              model: true
            }
          },
          plan: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.reservation.count()
    ]);

    return {
      reservations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Créer une demande de déverrouillage
   */
  async createUnlockRequest(userId: string, bikeId: string, reservationId: string) {
    if (reservationId) {
      const reservation = await prisma.reservation.findFirst({
        where: { id: reservationId, userId }
      });
      
      if (!reservation) {
        throw new Error('Réservation non trouvée ou non autorisée');
      }
    }
    
    return await this.bikeRequestService.createUnlockRequest(userId, bikeId);
  }

  /**
   * Créer une demande de verrouillage
   */
  async createLockRequest(userId: string, bikeId: string, rideId?: string, location?: { lat: number; lng: number }) {
    return await this.bikeRequestService.createLockRequest(userId, bikeId, rideId, location);
  }

  /**
   * Valider une demande de déverrouillage
   */
  async validateUnlockRequest(requestId: string, adminId: string, approved: boolean, adminNote?: string) {
    if (approved) {
      return await this.bikeRequestService.approveUnlockRequest(requestId, adminId);
    } else {
      return await this.bikeRequestService.rejectUnlockRequest(requestId, adminId, adminNote || 'Non spécifié');
    }
  }

  /**
   * Valider une demande de verrouillage
   */
  async validateLockRequest(requestId: string, adminId: string, approved: boolean, adminNote?: string) {
    if (approved) {
      return await this.bikeRequestService.approveLockRequest(requestId, adminId);
    } else {
      // Rejeter une demande de verrouillage
      const request = await prisma.lockRequest.findUnique({
        where: { id: requestId },
        include: { user: true, bike: true }
      });

      if (!request) {
        throw new Error('Demande non trouvée');
      }

      const updatedRequest = await prisma.lockRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          validatedBy: adminId,
          validatedAt: new Date(),
          adminNote: adminNote
        }
      });

      // Notifier l'utilisateur
      await this.notificationService.createNotification({
        userId: request.userId,
        title: 'Verrouillage refusé',
        message: `Votre demande de verrouillage a été refusée. Raison: ${adminNote || 'Non spécifié'}`,
        type: 'LOCK_REJECTED'
      });

      return updatedRequest;
    }
  }

  /**
   * Obtenir les demandes de déverrouillage
   */
  async getUnlockRequests() {
    return await this.bikeRequestService.getPendingRequests('unlock');
  }

  /**
   * Obtenir les demandes de verrouillage
   */
  async getLockRequests() {
    return await this.bikeRequestService.getPendingRequests('lock');
  }

  /**
   * Obtenir la caution requise
   */
  async getRequiredDeposit(): Promise<number> {
    const setting = await prisma.settings.findUnique({
      where: { key: 'required_deposit' }
    });
    return setting ? parseFloat(setting.value) : 20000;
  }

  /**
   * Notifier les admins
   */
  async notifyAdmins(title: string, message: string, type: string = 'ADMIN_ACTION') {
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPER_ADMIN' }
        ],
        isActive: true
      }
    });

    for (const admin of admins) {
      await this.notificationService.createNotification({
        userId: admin.id,
        title,
        message,
        type
      });
    }
  }
}

export default new ReservationService();