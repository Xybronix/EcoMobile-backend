import express from 'express';
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
        data: incidents,
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
        message: error.message
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
        data: incident
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

      const incident = await prisma.incident.create({
        data: {
          userId: req.user?.id!,
          bikeId: bikeId || null,
          type,
          description,
          priority: 'MEDIUM',
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
        message: error.message
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
        message: error.message
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
        message: error.message
      });
    }
  }
}

export default new IncidentController();