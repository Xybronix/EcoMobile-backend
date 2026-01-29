import express from 'express';
import WalletService from '../services/WalletService';
import { prisma } from '../config/prisma';
import { AuthRequest, logActivity } from '../middleware/auth';
import { t } from '../locales';

class IncidentController {
  /**
   * @swagger
   * /incidents:
   *   get:
   *     summary: Get user's incidents
   *     tags: [Incidents]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of incidents per page
   *     responses:
   *       200:
   *         description: User's incidents retrieved successfully
   */
  async getUserIncidents(req: AuthRequest, res: express.Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [incidents, total] = await Promise.all([
        prisma.incident.findMany({
          where: { userId: req.user?.id },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            bike: {
              select: {
                id: true,
                code: true,
                model: true
              }
            }
          }
        }),
        prisma.incident.count({ where: { userId: req.user?.id } })
      ]);

      // Pour les charges admin, récupérer les infos de l'admin qui les a créées
      const incidentsWithAdmin = await Promise.all(
        incidents.map(async (incident) => {
          if (incident.type === 'admin_charge' && incident.resolvedBy) {
            const admin = await prisma.user.findUnique({
              where: { id: incident.resolvedBy },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            });
            return {
              ...incident,
              resolvedByUser: admin ? {
                id: admin.id,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                fullName: `${admin.firstName} ${admin.lastName}`
              } : null
            };
          }
          return incident;
        })
      );

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'USER_INCIDENTS',
        '',
        'Viewed own incidents',
        { page, limit, total },
        req
      );

      return res.json({
        success: true,
        message: t('incidents.retrieved_success', req.language),
        data: incidentsWithAdmin,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /incidents/{id}:
   *   get:
   *     summary: Get incident by ID
   *     tags: [Incidents]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Incident ID
   *     responses:
   *       200:
   *         description: Incident retrieved successfully
   */
  async getIncidentById(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      
      const incident = await prisma.incident.findFirst({
        where: { 
          id,
          userId: req.user?.id 
        },
        include: {
          bike: {
            select: {
              id: true,
              code: true,
              model: true
            }
          }
        }
      });

      // Si c'est une charge admin et qu'il y a un resolvedBy, inclure les infos de l'admin
      let resolvedByUser = null;
      if (incident && incident.type === 'admin_charge' && incident.resolvedBy) {
        resolvedByUser = await prisma.user.findUnique({
          where: { id: incident.resolvedBy },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        });
      }

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: t('incidents.not_found', req.language)
        });
      }

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'INCIDENT',
        id,
        'Viewed incident details',
        null,
        req
      );

      return res.json({
        success: true,
        message: t('incidents.details_retrieved', req.language),
        data: {
          ...incident,
          resolvedByUser: resolvedByUser ? {
            id: resolvedByUser.id,
            firstName: resolvedByUser.firstName,
            lastName: resolvedByUser.lastName,
            email: resolvedByUser.email,
            fullName: `${resolvedByUser.firstName} ${resolvedByUser.lastName}`
          } : null
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /incidents:
   *   post:
   *     summary: Create new incident
   *     tags: [Incidents]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - description
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [brakes, battery, tire, chain, lights, lock, electronics, physical_damage, other]
   *                 description: Type of incident
   *               description:
   *                 type: string
   *                 minLength: 20
   *                 maxLength: 1000
   *                 description: Detailed description of the incident
   *               bikeId:
   *                 type: string
   *                 format: uuid
   *                 description: ID of the bike involved (optional)
   *               photos:
   *                 type: array
   *                 maxItems: 5
   *                 items:
   *                   type: string
   *                 description: Array of photo URLs (optional)
   *     responses:
   *       201:
   *         description: Incident created successfully
   */
  async createIncident(req: AuthRequest, res: express.Response) {
    try {
      const { type, description, bikeId } = req.body;

      const incident = await prisma.$transaction(async (tx) => {
        const newIncident = await tx.incident.create({
          data: {
            userId: req.user?.id!,
            bikeId: bikeId || null,
            type,
            description,
            priority: this.getIncidentPriority(type),
            status: 'OPEN'
          },
          include: {
            bike: {
              select: {
                id: true,
                code: true,
                model: true
              }
            }
          }
        });

        const criticalTypes = ['brakes', 'theft', 'physical_damage', 'electronics'];
        if (bikeId && criticalTypes.includes(type)) {
          await tx.bike.update({
            where: { id: bikeId },
            data: { status: 'MAINTENANCE' }
          });

          await tx.maintenanceLog.create({
            data: {
              bikeId,
              type: 'SECURITY_MAINTENANCE',
              description: `Maintenance automatique suite à incident: ${type} - ${description.substring(0, 100)}`,
              performedBy: 'SYSTEM'
            }
          });

          const admins = await tx.user.findMany({
            where: {
              role: { in: ['ADMIN', 'SUPER_ADMIN'] },
              isActive: true
            }
          });

          for (const admin of admins) {
            await tx.notification.create({
              data: {
                userId: admin.id,
                title: 'Vélo mis en maintenance',
                message: `Le vélo ${newIncident.bike?.code} a été automatiquement mis en maintenance suite à un incident critique: ${type}`,
                type: 'MAINTENANCE_ALERT'
              }
            });
          }
        }

        return newIncident;
      });

      await logActivity(
        req.user?.id || null,
        'CREATE',
        'INCIDENT',
        incident.id,
        `Created incident: ${type}`,
        { type, bikeId, description: description.substring(0, 100) },
        req
      );

      return res.status(201).json({
        success: true,
        message: t('incidents.created_success', req.language),
        data: incident
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /incidents/{id}:
   *   put:
   *     summary: Update incident
   *     tags: [Incidents]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Incident ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [brakes, battery, tire, chain, lights, lock, electronics, physical_damage, other]
   *                 description: Type of incident
   *               description:
   *                 type: string
   *                 minLength: 20
   *                 maxLength: 1000
   *                 description: Detailed description of the incident
   *               photos:
   *                 type: array
   *                 maxItems: 5
   *                 items:
   *                   type: string
   *                 description: Array of photo URLs (optional)
   *     responses:
   *       200:
   *         description: Incident updated successfully
   */
  async updateIncident(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const { type, description } = req.body;

      const existingIncident = await prisma.incident.findFirst({
        where: { 
          id,
          userId: req.user?.id 
        }
      });

      if (!existingIncident) {
        return res.status(404).json({
          success: false,
          message: t('incidents.not_found', req.language)
        });
      }

      if (existingIncident.status !== 'OPEN') {
        return res.status(400).json({
          success: false,
          message: t('incidents.cannot_update_not_open', req.language)
        });
      }

      const incident = await prisma.incident.update({
        where: { id },
        data: {
          type,
          description,
          updatedAt: new Date()
        },
        include: {
          bike: {
            select: {
              id: true,
              code: true,
              model: true
            }
          }
        }
      });

      await logActivity(
        req.user?.id || null,
        'UPDATE',
        'INCIDENT',
        id,
        `Updated incident: ${type}`,
        { oldData: existingIncident, newData: incident },
        req
      );

      return res.json({
        success: true,
        message: t('incidents.updated_success', req.language),
        data: incident
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /incidents/{id}:
   *   delete:
   *     summary: Delete incident
   *     tags: [Incidents]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Incident ID
   *     responses:
   *       200:
   *         description: Incident deleted successfully
   */
  async deleteIncident(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;

      const incident = await prisma.incident.findFirst({
        where: { 
          id,
          userId: req.user?.id 
        }
      });

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: t('incidents.not_found', req.language)
        });
      }

      if (incident.status !== 'OPEN') {
        return res.status(400).json({
          success: false,
          message: t('incidents.cannot_delete_not_open', req.language)
        });
      }

      await prisma.incident.delete({
        where: { id }
      });

      await logActivity(
        req.user?.id || null,
        'DELETE',
        'INCIDENT',
        id,
        `Deleted incident: ${incident.type}`,
        { deletedIncident: incident },
        req
      );

      return res.json({
        success: true,
        message: t('incidents.deleted_success', req.language)
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /incidents/admin/charge:
   *   post:
   *     summary: Créer une charge affectée par l'admin (déduite de la caution)
   *     tags: [Incidents]
   *     security:
   *       - bearerAuth: []
   */
  async createAdminCharge(req: AuthRequest, res: express.Response) {
    try {
      const { userId, bikeId, amount, reason, description, images } = req.body;
      const adminId = req.user!.id;

      if (!userId || !amount || !reason) {
        return res.status(400).json({
          success: false,
          message: 'userId, amount et reason sont requis'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le montant doit être supérieur à 0'
        });
      }

      // Vérifier que l'utilisateur existe
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true }
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier le vélo si spécifié
      let bike = null;
      if (bikeId) {
        bike = await prisma.bike.findUnique({
          where: { id: bikeId },
          select: { id: true, code: true, model: true }
        });

        if (!bike) {
          return res.status(404).json({
            success: false,
            message: 'Vélo non trouvé'
          });
        }
      }

      // Créer d'abord l'incident pour avoir son ID
      const incident = await prisma.incident.create({
        data: {
          userId,
          bikeId: bikeId || null,
          type: 'admin_charge',
          description: `${reason}${description ? ': ' + description : ''}`,
          priority: 'HIGH',
          status: 'CLOSED',
          resolvedAt: new Date(),
          resolvedBy: adminId,
          adminNote: `Charge de ${amount} FCFA affectée par l'administrateur`,
          refundAmount: amount
        },
        include: {
          bike: {
            select: { id: true, code: true, model: true }
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      // Utiliser le service de wallet pour appliquer la charge (avec l'ID de l'incident dans les métadonnées)
      const result = await WalletService.chargeDamage(
        userId,
        amount,
        `${reason}${description ? ': ' + description : ''}`,
        images,
        adminId,
        incident.id // Passer l'ID de l'incident
      );

      await logActivity(
        adminId,
        'CREATE',
        'ADMIN_CHARGE',
        incident.id,
        `Admin charged user ${userId} with ${amount} FCFA`,
        { 
          userId, 
          bikeId, 
          amount, 
          reason, 
          transactionId: result.transaction.id 
        },
        req
      );

      return res.status(201).json({
        success: true,
        message: `Charge de ${amount} FCFA affectée avec succès`,
        data: {
          incident,
          transaction: result.transaction,
          newDepositBalance: result.wallet.deposit
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /incidents/admin/charge/{id}:
   *   put:
   *     summary: Modifier une charge admin (super admin ou créateur uniquement)
   *     tags: [Incidents]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de l'incident/charge
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               bikeId:
   *                 type: string
   *                 nullable: true
   *               amount:
   *                 type: number
   *               reason:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Charge modifiée avec succès
   *       403:
   *         description: Permission refusée
   *       404:
   *         description: Charge non trouvée
   */
  async updateAdminCharge(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const { bikeId, amount, reason, description } = req.body;
      const adminId = req.user!.id;
      const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';

      // Récupérer l'incident
      const incident = await prisma.incident.findUnique({
        where: { id },
        include: {
          bike: {
            select: { id: true, code: true, model: true }
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Charge non trouvée'
        });
      }

      // Vérifier que c'est bien une charge admin
      if (incident.type !== 'admin_charge') {
        return res.status(400).json({
          success: false,
          message: 'Cet incident n\'est pas une charge admin'
        });
      }

      // Vérifier les permissions : super admin ou créateur de la charge
      if (!isSuperAdmin && incident.resolvedBy !== adminId) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas la permission de modifier cette charge'
        });
      }

      // Vérifier le vélo si spécifié
      let bike = null;
      if (bikeId && bikeId !== 'none') {
        bike = await prisma.bike.findUnique({
          where: { id: bikeId },
          select: { id: true, code: true, model: true }
        });

        if (!bike) {
          return res.status(404).json({
            success: false,
            message: 'Vélo non trouvé'
          });
        }
      }

      // Récupérer la transaction associée pour mettre à jour le montant si nécessaire
      const allTransactions = await prisma.transaction.findMany({
        where: {
          wallet: { userId: incident.userId },
          type: 'DAMAGE_CHARGE' as any
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Trouver la transaction avec l'incidentId dans les métadonnées
      const transaction = allTransactions.find(t => {
        const metadata = t.metadata as any;
        return metadata?.incidentId === id;
      });

      // Si le montant change, mettre à jour la transaction et le wallet
      if (amount && transaction) {
        const oldAmount = Math.abs(transaction.amount);
        const newAmount = parseFloat(amount);
        const difference = newAmount - oldAmount;

        if (difference !== 0) {
          const wallet = await prisma.wallet.findUnique({
            where: { userId: incident.userId }
          });

          if (wallet) {
            // Mettre à jour la transaction
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: {
                amount: -newAmount,
                totalAmount: -newAmount,
                metadata: {
                  ...(transaction.metadata as any),
                  amount: newAmount,
                  reason: reason || (transaction.metadata as any)?.reason,
                  description: description || (transaction.metadata as any)?.description
                }
              }
            });

            // Ajuster le solde de la caution
            await prisma.wallet.update({
              where: { id: wallet.id },
              data: {
                deposit: {
                  increment: -difference // Si différence positive, on déduit plus, sinon on rembourse
                }
              }
            });
          }
        }
      }

      // Mettre à jour l'incident
      const updatedIncident = await prisma.incident.update({
        where: { id },
        data: {
          description: `${reason}${description ? ': ' + description : ''}`,
          adminNote: `Charge de ${amount || incident.refundAmount || 0} FCFA affectée par l'administrateur`,
          refundAmount: amount ? parseFloat(amount) : (incident.refundAmount || 0),
          bike: bikeId && bikeId !== 'none' ? {
            connect: { id: bikeId }
          } : bikeId === 'none' ? {
            disconnect: true
          } : undefined
        },
        include: {
          bike: {
            select: { id: true, code: true, model: true }
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      await logActivity(
        adminId,
        'UPDATE',
        'ADMIN_CHARGE',
        id,
        `Admin updated charge for user ${incident.userId}`,
        { 
          userId: incident.userId, 
          bikeId: bikeId || incident.bikeId, 
          oldAmount: incident.refundAmount,
          newAmount: amount || incident.refundAmount,
          reason, 
          description
        },
        req
      );

      return res.json({
        success: true,
        message: 'Charge modifiée avec succès',
        data: updatedIncident
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  /**
   * @swagger
   * /incidents/admin/charge/{id}:
   *   delete:
   *     summary: Supprimer une charge admin (super admin ou créateur uniquement)
   *     tags: [Incidents]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de l'incident/charge
   *     responses:
   *       200:
   *         description: Charge supprimée avec succès
   *       403:
   *         description: Permission refusée
   *       404:
   *         description: Charge non trouvée
   */
  async deleteAdminCharge(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';

      // Récupérer l'incident
      const incident = await prisma.incident.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Charge non trouvée'
        });
      }

      // Vérifier que c'est bien une charge admin
      if (incident.type !== 'admin_charge') {
        return res.status(400).json({
          success: false,
          message: 'Cet incident n\'est pas une charge admin'
        });
      }

      // Vérifier les permissions : super admin ou créateur de la charge
      if (!isSuperAdmin && incident.resolvedBy !== adminId) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas la permission de supprimer cette charge'
        });
      }

      // Récupérer la transaction associée pour rembourser
      const allTransactions = await prisma.transaction.findMany({
        where: {
          wallet: { userId: incident.userId },
          type: 'DAMAGE_CHARGE' as any
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Trouver la transaction avec l'incidentId dans les métadonnées
      const transaction = allTransactions.find(t => {
        const metadata = t.metadata as any;
        return metadata?.incidentId === id;
      });

      if (transaction) {
        const wallet = await prisma.wallet.findUnique({
          where: { userId: incident.userId }
        });

        if (wallet) {
          // Rembourser le montant (inverser la transaction)
          const refundAmount = Math.abs(transaction.amount);
          
          await prisma.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'REFUND' as any,
              amount: refundAmount,
              fees: 0,
              totalAmount: refundAmount,
              status: 'COMPLETED',
              paymentMethod: 'ADMIN_CHARGE_REVERSAL',
              metadata: {
                incidentId: id,
                originalTransactionId: transaction.id,
                description: `Remboursement de la charge admin supprimée`
              }
            }
          });

          // Restaurer le solde de la caution
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: {
              deposit: {
                increment: refundAmount
              }
            }
          });
        }
      }

      // Supprimer l'incident
      await prisma.incident.delete({
        where: { id }
      });

      await logActivity(
        adminId,
        'DELETE',
        'ADMIN_CHARGE',
        id,
        `Admin deleted charge for user ${incident.userId}`,
        { 
          userId: incident.userId, 
          amount: incident.refundAmount,
          reason: incident.description
        },
        req
      );

      return res.json({
        success: true,
        message: 'Charge supprimée avec succès'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || t('error.server', req.language || 'fr')
      });
    }
  }

  private getIncidentPriority(type: string): string {
    const criticalTypes = ['brakes', 'theft', 'physical_damage'];
    const highTypes = ['battery', 'tire', 'lock'];
    
    if (criticalTypes.includes(type)) return 'HIGH';
    if (highTypes.includes(type)) return 'MEDIUM';
    return 'LOW';
  }
}

export default new IncidentController();