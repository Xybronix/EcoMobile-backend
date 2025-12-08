import express from 'express';
import { AuthRequest, logActivity } from '../middleware/auth';
import BikeRequestService from '../services/BikeRequestService';
import { prisma } from '../config/prisma';

export class BikeRequestController {
  /**
   * Créer demande de déverrouillage
   */
  async createUnlockRequest(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { bikeId, metadata } = req.body;

      if (!bikeId) {
        return res.status(400).json({
          success: false,
          message: 'bikeId est requis'
        });
      }

      const request = await BikeRequestService.createUnlockRequest(userId, bikeId, metadata);

      await logActivity(
        userId,
        'CREATE',
        'UNLOCK_REQUEST',
        request.id,
        `Requested unlock for bike ${bikeId}`,
        { bikeId, hasInspectionData: !!metadata },
        req
      );

      return res.json({
        success: true,
        message: 'Demande de déverrouillage envoyée',
        data: request
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Créer demande de verrouillage
   */
  async createLockRequest(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { bikeId, rideId, location, metadata } = req.body;

      const request = await BikeRequestService.createLockRequest(userId, bikeId, rideId, location, metadata);

      await logActivity(
        userId,
        'CREATE',
        'LOCK_REQUEST',
        request.id,
        `Requested lock for bike ${bikeId}`,
        { bikeId, rideId },
        req
      );

      res.json({
        success: true,
        message: 'Demande de verrouillage envoyée',
        data: request
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir les demandes de déverrouillage de l'utilisateur
   */
  async getUserUnlockRequests(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        prisma.unlockRequest.findMany({
          where: { userId },
          include: {
            bike: {
              select: {
                id: true,
                code: true,
                model: true
              }
            }
            // validatedByUser n'existe pas dans le schéma, on utilise validatedBy qui est un string
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.unlockRequest.count({ where: { userId } })
      ]);

      // Récupérer les informations des validateurs si nécessaire
      const validatedByUserIds = requests
        .filter(req => req.validatedBy)
        .map(req => req.validatedBy) as string[];

      let validators: any[] = [];
      if (validatedByUserIds.length > 0) {
        validators = await prisma.user.findMany({
          where: { id: { in: validatedByUserIds } },
          select: { id: true, firstName: true, lastName: true }
        });
      }

      const validatorMap = validators.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);

      // Enrichir les demandes avec les informations des validateurs
      const enrichedRequests = requests.map(request => ({
        ...request,
        validatedByUser: request.validatedBy ? validatorMap[request.validatedBy] : null
      }));

      await logActivity(
        userId,
        'VIEW',
        'USER_UNLOCK_REQUESTS',
        '',
        'Viewed unlock requests history',
        { page, limit, total },
        req
      );

      res.json({
        success: true,
        data: enrichedRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir les demandes de verrouillage de l'utilisateur
   */
  async getUserLockRequests(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        prisma.lockRequest.findMany({
          where: { userId },
          include: {
            bike: {
              select: {
                id: true,
                code: true,
                model: true
              }
            },
            ride: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                cost: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.lockRequest.count({ where: { userId } })
      ]);

      // Récupérer les informations des validateurs
      const validatedByUserIds = requests
        .filter(req => req.validatedBy)
        .map(req => req.validatedBy) as string[];

      let validators: any[] = [];
      if (validatedByUserIds.length > 0) {
        validators = await prisma.user.findMany({
          where: { id: { in: validatedByUserIds } },
          select: { id: true, firstName: true, lastName: true }
        });
      }

      const validatorMap = validators.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);

      // Enrichir les demandes avec les informations des validateurs
      const enrichedRequests = requests.map(request => ({
        ...request,
        validatedByUser: request.validatedBy ? validatorMap[request.validatedBy] : null
      }));

      await logActivity(
        userId,
        'VIEW',
        'USER_LOCK_REQUESTS',
        '',
        'Viewed lock requests history',
        { page, limit, total },
        req
      );

      res.json({
        success: true,
        data: enrichedRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir toutes les demandes de l'utilisateur (déverrouillage + verrouillage)
   */
  async getAllUserRequests(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const [unlockRequests, lockRequests, unlockTotal, lockTotal] = await Promise.all([
        prisma.unlockRequest.findMany({
          where: { userId },
          include: {
            bike: {
              select: {
                id: true,
                code: true,
                model: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.lockRequest.findMany({
          where: { userId },
          include: {
            bike: {
              select: {
                id: true,
                code: true,
                model: true
              }
            },
            ride: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                cost: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.unlockRequest.count({ where: { userId } }),
        prisma.lockRequest.count({ where: { userId } })
      ]);

      // Récupérer tous les validateurs
      const allValidatedByIds = [
        ...unlockRequests.filter(req => req.validatedBy).map(req => req.validatedBy),
        ...lockRequests.filter(req => req.validatedBy).map(req => req.validatedBy)
      ].filter(Boolean) as string[];

      let validators: any[] = [];
      if (allValidatedByIds.length > 0) {
        validators = await prisma.user.findMany({
          where: { id: { in: allValidatedByIds } },
          select: { id: true, firstName: true, lastName: true }
        });
      }

      const validatorMap = validators.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);

      // Combiner et enrichir les demandes
      const allRequests = [
        ...unlockRequests.map(req => ({ 
          ...req, 
          type: 'unlock' as const,
          validatedByUser: req.validatedBy ? validatorMap[req.validatedBy] : null
        })),
        ...lockRequests.map(req => ({ 
          ...req, 
          type: 'lock' as const,
          validatedByUser: req.validatedBy ? validatorMap[req.validatedBy] : null
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
       .slice(0, limit);

      const total = unlockTotal + lockTotal;

      await logActivity(
        userId,
        'VIEW',
        'USER_ALL_REQUESTS',
        '',
        'Viewed all requests history',
        { page, limit, total },
        req
      );

      res.json({
        success: true,
        data: allRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir une demande spécifique par ID
   */
  async getRequestById(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;
      const { id, type } = req.params;

      let request;
      if (type === 'unlock') {
        request = await prisma.unlockRequest.findFirst({
          where: { 
            id,
            userId 
          },
          include: {
            bike: {
              select: {
                id: true,
                code: true,
                model: true,
                status: true
              }
            }
          }
        });
      } else if (type === 'lock') {
        request = await prisma.lockRequest.findFirst({
          where: { 
            id,
            userId 
          },
          include: {
            bike: {
              select: {
                id: true,
                code: true,
                model: true,
                status: true
              }
            },
            ride: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                cost: true,
                duration: true
              }
            }
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Type de demande invalide'
        });
      }

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Demande non trouvée'
        });
      }

      // Récupérer les informations du validateur si nécessaire
      if (request.validatedBy) {
        const validator = await prisma.user.findUnique({
          where: { id: request.validatedBy },
          select: { id: true, firstName: true, lastName: true }
        });
        
        request = {
          ...request,
          validatedByUser: validator
        };
      }

      await logActivity(
        userId,
        'VIEW',
        `${type.toUpperCase()}_REQUEST`,
        id,
        `Viewed ${type} request details`,
        null,
        req
      );

      return res.json({
        success: true,
        data: { ...request, type }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir demandes en attente (admin)
   */
  async getPendingRequests(req: AuthRequest, res: express.Response) {
    try {
      const type = req.params.type as 'unlock' | 'lock';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await BikeRequestService.getPendingRequests(type, page, limit);

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
   * Approuver une demande
   */
  async approveRequest(req: AuthRequest, res: express.Response) {
    try {
      const adminId = req.user!.id;
      const { type, id } = req.params;

      let result;
      if (type === 'unlock') {
        result = await BikeRequestService.approveUnlockRequest(id, adminId);
      } else {
        result = await BikeRequestService.approveLockRequest(id, adminId);
      }

      await logActivity(
        adminId,
        'UPDATE',
        `${type.toUpperCase()}_REQUEST`,
        id,
        `Approved ${type} request`,
        { requestId: id },
        req
      );

      res.json({
        success: true,
        message: `Demande de ${type === 'unlock' ? 'déverrouillage' : 'verrouillage'} approuvée`,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Rejeter une demande
   */
  async rejectRequest(req: AuthRequest, res: express.Response) {
    try {
      const adminId = req.user!.id;
      const { type, id } = req.params;
      const { reason } = req.body;

      let result;
      if (type === 'unlock') {
        result = await BikeRequestService.rejectUnlockRequest(id, adminId, reason);
      } else {
        // Pour l'instant, on gère seulement le rejet des déverrouillages
        throw new Error('Rejet des demandes de verrouillage non implémenté');
      }

      await logActivity(
        adminId,
        'UPDATE',
        `${type.toUpperCase()}_REQUEST`,
        id,
        `Rejected ${type} request`,
        { requestId: id, reason },
        req
      );

      res.json({
        success: true,
        message: `Demande de ${type === 'unlock' ? 'déverrouillage' : 'verrouillage'} rejetée`,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtenir les statistiques des demandes pour l'utilisateur
   */
  async getUserRequestStats(req: AuthRequest, res: express.Response) {
    try {
      const userId = req.user!.id;

      const [
        totalUnlockRequests,
        pendingUnlockRequests,
        approvedUnlockRequests,
        totalLockRequests,
        pendingLockRequests,
        approvedLockRequests
      ] = await Promise.all([
        prisma.unlockRequest.count({ where: { userId } }),
        prisma.unlockRequest.count({ where: { userId, status: 'PENDING' } }),
        prisma.unlockRequest.count({ where: { userId, status: 'APPROVED' } }),
        prisma.lockRequest.count({ where: { userId } }),
        prisma.lockRequest.count({ where: { userId, status: 'PENDING' } }),
        prisma.lockRequest.count({ where: { userId, status: 'APPROVED' } })
      ]);

      const stats = {
        unlock: {
          total: totalUnlockRequests,
          pending: pendingUnlockRequests,
          approved: approvedUnlockRequests,
          rejected: totalUnlockRequests - pendingUnlockRequests - approvedUnlockRequests
        },
        lock: {
          total: totalLockRequests,
          pending: pendingLockRequests,
          approved: approvedLockRequests,
          rejected: totalLockRequests - pendingLockRequests - approvedLockRequests
        },
        total: totalUnlockRequests + totalLockRequests
      };

      await logActivity(
        userId,
        'VIEW',
        'USER_REQUEST_STATS',
        '',
        'Viewed request statistics',
        { stats },
        req
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new BikeRequestController();