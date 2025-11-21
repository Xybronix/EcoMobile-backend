import express from 'express';
import { AuthRequest, logActivity } from '../middleware/auth';
import ReservationService from '../services/ReservationService';
import { t } from '../locales';

export class ReservationController {
  
  /**
   * @swagger
   * /api/v1/reservations:
   *   post:
   *     summary: Créer une nouvelle réservation
   *     tags: [Reservations]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       201:
   *         description: Réservation créée avec succès
   */
  async createReservation(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { bikeId, planId, packageType, startDate, startTime } = req.body;

      const reservation = await ReservationService.createReservation({
        userId,
        bikeId,
        planId,
        packageType,
        startDate: new Date(startDate),
        startTime
      });

      await logActivity(
        userId,
        'CREATE',
        'RESERVATION',
        reservation.id,
        `Created reservation for bike ${reservation.bike.code}`,
        { bikeId, planId, packageType, startDate },
        req
      );

      return res.status(201).json({
        success: true,
        message: t('reservation.create', req.language),
        data: reservation
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/reservations/user:
   *   get:
   *     summary: Obtenir les réservations de l'utilisateur
   *     tags: [Reservations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [ACTIVE, CANCELLED, COMPLETED]
   *         description: Filtrer par statut
   *     responses:
   *       200:
   *         description: Liste des réservations
   */
  async getUserReservations(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { status } = req.query;
      
      const reservations = await ReservationService.getUserReservations(userId, status as string);

      res.json({
        success: true,
        data: reservations
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/reservations/{id}:
   *   put:
   *     summary: Modifier une réservation
   *     tags: [Reservations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la réservation
   *     responses:
   *       200:
   *         description: Réservation mise à jour
   */
  async updateReservation(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { planId, packageType, startDate, startTime } = req.body;

      const updatedReservation = await ReservationService.updateReservation(id, userId, {
        planId,
        packageType,
        startDate: startDate ? new Date(startDate) : undefined,
        startTime
      });

      return res.json({
        success: true,
        message: 'Réservation mise à jour',
        data: updatedReservation
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/reservations/{id}:
   *   delete:
   *     summary: Annuler une réservation
   *     tags: [Reservations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la réservation
   *     responses:
   *       200:
   *         description: Réservation annulée
   */
  async cancelReservation(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await ReservationService.cancelReservation(id, userId);

      return res.json({
        success: true,
        message: 'Réservation annulée'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/reservations:
   *   get:
   *     summary: Obtenir toutes les réservations (Admin)
   *     tags: [Reservations, Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *     responses:
   *       200:
   *         description: Liste des réservations avec pagination
   */
  async getAllReservations(req: AuthRequest, res: express.Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await ReservationService.getAllReservations(page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/reservations/unlock:
   *   post:
   *     summary: Demander le déverrouillage d'un vélo
   *     tags: [Reservations]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       201:
   *         description: Demande de déverrouillage créée
   */
  async requestUnlock(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { bikeId, reservationId } = req.body;

      const unlockRequest = await ReservationService.createUnlockRequest(userId, bikeId, reservationId);

      await logActivity(
        userId,
        'CREATE',
        'UNLOCK_REQUEST',
        unlockRequest.id,
        `Requested unlock for bike ${bikeId}`,
        { bikeId, reservationId },
        req
      );

      return res.status(201).json({
        success: true,
        message: 'Demande de déverrouillage envoyée',
        data: unlockRequest
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/reservations/lock:
   *   post:
   *     summary: Demander le verrouillage d'un vélo
   *     tags: [Reservations]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       201:
   *         description: Demande de verrouillage créée
   */
  async requestLock(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { bikeId, rideId, location } = req.body;

      const lockRequest = await ReservationService.createLockRequest(userId, bikeId, rideId, location);

      await logActivity(
        userId,
        'CREATE',
        'LOCK_REQUEST',
        lockRequest.id,
        `Requested lock for bike ${bikeId}`,
        { bikeId, rideId },
        req
      );

      res.status(201).json({
        success: true,
        message: 'Demande de verrouillage envoyée',
        data: lockRequest
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/reservations/unlock-requests:
   *   get:
   *     summary: Obtenir les demandes de déverrouillage (Admin)
   *     tags: [Reservations, Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Liste des demandes de déverrouillage
   */
  async getUnlockRequests(_req: AuthRequest, res: express.Response) {
    try {
      const requests = await ReservationService.getUnlockRequests();

      res.json({
        success: true,
        data: requests
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/reservations/unlock-requests/{id}/validate:
   *   post:
   *     summary: Valider une demande de déverrouillage (Admin)
   *     tags: [Reservations, Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Demande validée
   */
  async validateUnlockRequest(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const { approved, adminNote } = req.body;
      const adminId = req.user!.id;

      await ReservationService.validateUnlockRequest(id, adminId, approved, adminNote);

      await logActivity(
        adminId,
        'UPDATE',
        'UNLOCK_REQUEST',
        id,
        `${approved ? 'Approved' : 'Rejected'} unlock request`,
        { requestId: id, approved, adminNote },
        req
      );

      return res.json({
        success: true,
        message: `Demande ${approved ? 'approuvée' : 'rejetée'}`
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/reservations/lock-requests:
   *   get:
   *     summary: Obtenir les demandes de verrouillage (Admin)
   *     tags: [Reservations, Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Liste des demandes de verrouillage
   */
  async getLockRequests(_req: AuthRequest, res: express.Response) {
    try {
      const requests = await ReservationService.getLockRequests();

      res.json({
        success: true,
        data: requests
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/reservations/lock-requests/{id}/validate:
   *   post:
   *     summary: Valider une demande de verrouillage (Admin)
   *     tags: [Reservations, Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Demande validée
   */
  async validateLockRequest(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const { approved, adminNote } = req.body;
      const adminId = req.user!.id;

      await ReservationService.validateLockRequest(id, adminId, approved, adminNote);

      await logActivity(
        adminId,
        'UPDATE',
        'LOCK_REQUEST',
        id,
        `${approved ? 'Approved' : 'Rejected'} lock request`,
        { requestId: id, approved, adminNote },
        req
      );

      return res.json({
        success: true,
        message: `Demande ${approved ? 'approuvée' : 'rejetée'}`
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new ReservationController();