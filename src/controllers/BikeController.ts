import express from 'express';
import { prisma } from '../config/prisma';
import BikeService from '../services/BikeService';
import { BikeStatus } from '@prisma/client';
import { AuthRequest, logActivity } from '../middleware/auth';
import { t } from '../locales';

export class BikeController {
  /**
   * @swagger
   * /bikes:
   *   get:
   *     summary: Get all bikes
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [AVAILABLE, IN_USE, MAINTENANCE, UNAVAILABLE]
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Bikes retrieved
   */
  async getAllBikes(req: AuthRequest, res: express.Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as BikeStatus;

      const filter: any = {};
      if (status) filter.status = status;

      const result = await BikeService.getAllBikes(filter, page, limit);

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'BIKES',
        '',
        `Viewed bikes list (page ${page}, status: ${status || 'all'})`,
        { page, limit, status, count: result.bikes.length },
        req
      );

      res.json({
        success: true,
        message: t('bike.list_retrieved', req.language),
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
   * /bikes/public:
   *   get:
   *     summary: Get bikes for public
   *     tags: [Bikes]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: latitude
   *         schema:
   *           type: number
   *       - in: query
   *         name: longitude
   *         schema:
   *           type: number
   *       - in: query
   *         name: radius
   *         schema:
   *           type: number
   *       - in: query
   *         name: minBatteryLevel
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Public bikes retrieved
   */
  async getPublicBikes(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userLat = req.query.latitude ? parseFloat(req.query.latitude as string) : null;
      const userLng = req.query.longitude ? parseFloat(req.query.longitude as string) : null;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : undefined;
      const minBatteryLevel = req.query.minBatteryLevel ? parseInt(req.query.minBatteryLevel as string) : undefined;

      const filter: any = {
        status: BikeStatus.AVAILABLE,
        isActive: true,
        hasPricingPlan: true,
        radiusKm: radius,
        minBatteryLevel
      };

      if (userLat !== null && userLng !== null) {
        filter.latitude = userLat;
        filter.longitude = userLng;
      }

      const result = await BikeService.getAllBikes(filter, page, limit);

      await logActivity(
        null,
        'VIEW',
        'BIKES_PUBLIC_AVAILABLE',
        '',
        `Public app viewed available bikes (page ${page}, with location: ${!!(userLat && userLng)})`,
        { 
          page, 
          limit, 
          userLocation: userLat && userLng ? { lat: userLat, lng: userLng } : null,
          count: result.bikes.length 
        },
        req
      );

      res.json({
        success: true,
        message: t('bike.available_retrieved', req.language),
        data: result.bikes,
        pagination: result.pagination
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
   * /bikes/available:
   *   get:
   *     summary: Get all available bikes
   *     description: Retrieve a list of all bikes with status AVAILABLE
   *     tags: [Bikes]
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
   *         description: Number of bikes per page
   *       - in: query
   *         name: latitude
   *         schema:
   *           type: number
   *         description: User's latitude for distance calculation (optional)
   *       - in: query
   *         name: longitude
   *         schema:
   *           type: number
   *         description: User's longitude for distance calculation (optional)
   *     responses:
   *       200:
   *         description: Available bikes retrieved successfully
   */
  async getAvailableBikes(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const userLat = req.query.latitude ? parseFloat(req.query.latitude as string) : null;
      const userLng = req.query.longitude ? parseFloat(req.query.longitude as string) : null;
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : undefined;
      const minBatteryLevel = req.query.minBatteryLevel ? parseInt(req.query.minBatteryLevel as string) : undefined;

      // Validation des paramètres
      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters'
        });
        return;
      }

      const filter: any = {
        status: BikeStatus.AVAILABLE,
        isActive: true,
        hasPricingPlan: true,
        minBatteryLevel
      };

      if (userLat !== null && userLng !== null) {
        filter.latitude = userLat;
        filter.longitude = userLng;
        filter.radiusKm = radius;
      }

      const result = await BikeService.getAvailableBikes(filter, page, limit);

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'BIKES_AVAILABLE',
        '',
        `Viewed available bikes (page ${page}, with location: ${!!(userLat && userLng)})`,
        { 
          page, 
          limit, 
          userLocation: userLat && userLng ? { lat: userLat, lng: userLng } : null,
          count: result.bikes.length 
        },
        req
      );

      res.json({
        success: true,
        message: t('bike.available_retrieved', req.language),
        data: result.bikes,
        pagination: result.pagination
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
   * /bikes/nearby:
   *   get:
   *     summary: Get nearby bikes
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: latitude
   *         required: true
   *         schema:
   *           type: number
   *       - in: query
   *         name: longitude
   *         required: true
   *         schema:
   *           type: number
   *       - in: query
   *         name: radius
   *         schema:
   *           type: number
   *           default: 2
   *     responses:
   *       200:
   *         description: Nearby bikes retrieved
   */
  async getNearbyBikes(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = parseFloat(req.query.radius as string) || 2;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
        return;
      }

      const bikes = await BikeService.getNearbyBikes(latitude, longitude, radius);

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'BIKES_NEARBY',
        '',
        `Searched for nearby bikes (radius: ${radius}km)`,
        { 
          userLocation: { lat: latitude, lng: longitude },
          radius,
          count: bikes.length 
        },
        req
      );

      res.json({
        success: true,
        message: t('bike.nearby_retrieved', req.language),
        data: bikes
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
   * /bikes/areas/default:
   *   get:
   *     summary: Get default areas (Cameroon neighborhoods)
   *     tags: [Bikes]
   *     responses:
   *       200:
   *         description: Default areas retrieved
   */
  async getDefaultAreas(_req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const areas = await BikeService.getDefaultAreas();

      res.json({
        success: true,
        message: 'Default areas retrieved successfully',
        data: areas
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
   * /bikes/areas/search:
   *   post:
   *     summary: Search areas using Google Places
   *     tags: [Bikes]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - query
   *             properties:
   *               query:
   *                 type: string
   *               country:
   *                 type: string
   *                 default: CM
   *     responses:
   *       200:
   *         description: Areas found
   */
  async searchAreas(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { query, country = 'CM' } = req.body;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Query parameter is required'
        });
        return;
      }

      const areas = await BikeService.searchAreas(query, country);

      await logActivity(
        req.user?.id || null,
        'SEARCH',
        'AREAS',
        '',
        `Searched areas with query: ${query}`,
        { query, country, count: areas.length },
        req
      );

      res.json({
        success: true,
        message: 'Areas found successfully',
        data: areas
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
   * /bikes/sync-gps:
   *   post:
   *     summary: Sync all bikes with GPS data (Admin only)
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: GPS sync completed
   */
  async syncGpsData(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const syncResults = await BikeService.syncAllBikesWithGps();

      await logActivity(
        req.user?.id || null,
        'SYNC',
        'BIKES_GPS',
        '',
        'Synchronized GPS data for all bikes',
        { syncResults },
        req
      );

      res.json({
        success: true,
        message: 'GPS synchronization completed successfully',
        data: syncResults
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
   * /bikes/realtime-positions:
   *   get:
   *     summary: Get real-time positions of all bikes with GPS
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Real-time positions retrieved
   */
  async getRealtimePositions(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const positions = await BikeService.getRealtimePositions();

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'BIKES_REALTIME',
        '',
        'Viewed real-time bike positions',
        { bikeCount: positions.length },
        req
      );

      res.json({
        success: true,
        message: 'Positions en temps réel récupérées',
        data: positions
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
   * /bikes/{id}/track:
   *   get:
   *     summary: Get bike GPS track for a time period
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: startTime
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: endTime
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *     responses:
   *       200:
   *         description: GPS track retrieved
   */
  async getBikeTrack(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startTime, endTime } = req.query;

      if (!startTime || !endTime) {
        res.status(400).json({
          success: false,
          message: 'startTime and endTime are required'
        });
        return;
      }

      const track = await BikeService.getBikeTrack(
        id, 
        new Date(startTime as string), 
        new Date(endTime as string)
      );

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'BIKE_TRACK',
        id,
        `Viewed GPS track for bike ${id}`,
        { startTime, endTime, trackPoints: track.length },
        req
      );

      res.json({
        success: true,
        message: 'GPS track retrieved successfully',
        data: track
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
   * /bikes/{id}/mileage:
   *   get:
   *     summary: Get bike mileage for a time period
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: startTime
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: endTime
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *     responses:
   *       200:
   *         description: Mileage data retrieved
   */
  async getBikeMileage(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startTime, endTime } = req.query;

      if (!startTime || !endTime) {
        res.status(400).json({
          success: false,
          message: 'startTime and endTime are required'
        });
        return;
      }

      const mileage = await BikeService.getBikeMileage(
        id, 
        new Date(startTime as string), 
        new Date(endTime as string)
      );

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'BIKE_MILEAGE',
        id,
        `Viewed mileage data for bike ${id}`,
        { startTime, endTime, mileage },
        req
      );

      res.json({
        success: true,
        message: 'Mileage data retrieved successfully',
        data: mileage
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
   * /bikes/{id}:
   *   get:
   *     summary: Get bike by ID
   *     tags: [Bikes]
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
   *         description: Bike retrieved
   */
  async getBikeById(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const bike = await BikeService.getBikeById(id);

      if (!bike) {
        res.status(404).json({
          success: false,
          message: t('bike.not_found', req.language)
        });
        return;
      }

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'BIKE',
        id,
        `Viewed bike details: ${bike?.code}`,
        { bikeCode: bike?.code, model: bike?.model },
        req
      );

      res.json({
        success: true,
        data: bike
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
   * /bikes/code/{code}:
   *   get:
   *     summary: Get bike by code or QR code
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Bike retrieved
   */
  async getBikeByCode(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { code } = req.params;
      const bike = await BikeService.getBikeByCode(code);

      if (!bike) {
        res.status(404).json({
          success: false,
          message: t('bike.not_found', req.language)
        });
        return;
      }

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'BIKE',
        bike?.id || '',
        `Searched bike by code: ${code}`,
        { searchCode: code, bikeId: bike?.id },
        req
      );

      res.json({
        success: true,
        data: bike
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
   * /bikes:
   *   post:
   *     summary: Create a new bike (Admin only)
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *               - model
   *             properties:
   *               code:
   *                 type: string
   *               model:
   *                 type: string
   *               status:
   *                 type: string
   *               batteryLevel:
   *                 type: integer
   *               latitude:
   *                 type: number
   *               longitude:
   *                 type: number
   *     responses:
   *       201:
   *         description: Bike created
   */
  async createBike(req: AuthRequest, res: express.Response) {
    try {
      const bike = await BikeService.createBike(req.body);

      await logActivity(
        req.user?.id || null,
        'CREATE',
        'BIKE',
        bike.id,
        `Created new bike: ${bike.code}`,
        { code: bike.code, model: bike.model, status: bike.status },
        req
      );

      res.status(201).json({
        success: true,
        message: t('bike.created', req.language),
        data: bike
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
   * /bikes/{id}:
   *   put:
   *     summary: Update bike (Admin only)
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Bike updated
   */
  async updateBike(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const oldBike = await BikeService.getBikeById(id);
      const bike = await BikeService.updateBike(id, req.body);

      await logActivity(
        req.user?.id || null,
        'UPDATE',
        'BIKE',
        id,
        `Updated bike: ${bike.code}`,
        { oldData: oldBike, newData: bike },
        req
      );

      res.json({
        success: true,
        message: t('bike.updated', req.language),
        data: bike
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
   * /bikes/{id}:
   *   delete:
   *     summary: Delete bike (Admin only)
   *     tags: [Bikes]
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
   *         description: Bike deleted
   */
  async deleteBike(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const bike = await BikeService.getBikeById(id);
      await BikeService.deleteBike(id);

      await logActivity(
        req.user?.id || null,
        'DELETE',
        'BIKE',
        id,
        `Deleted bike: ${bike?.code}`,
        { deletedBike: bike },
        req
      );

      res.json({
        success: true,
        message: t('bike.deleted', req.language)
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
   * /bikes/{id}/unlock:
   *   post:
   *     summary: Unlock bike
   *     tags: [Bikes]
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
   *         description: Bike unlocked
   */
  async unlockBike(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const bike = await BikeService.unlockBike(id);

      await logActivity(
        req.user?.id || null,
        'UNLOCK',
        'BIKE',
        id,
        `Unlocked bike: ${bike.code}`,
        { bikeCode: bike.code, batteryLevel: bike.batteryLevel },
        req
      );

      res.json({
        success: true,
        message: t('bike.unlocked', req.language),
        data: bike
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /bikes/{id}/lock:
   *   post:
   *     summary: Lock bike
   *     tags: [Bikes]
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
   *         description: Bike locked
   */
  async lockBike(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const bike = await BikeService.lockBike(id);

      await logActivity(
        req.user?.id || null,
        'LOCK',
        'BIKE',
        id,
        `Locked bike: ${bike.code}`,
        { bikeCode: bike.code },
        req
      );

      res.json({
        success: true,
        message: t('bike.locked', req.language),
        data: bike
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
   * /bikes/{id}/maintenance:
   *   post:
   *     summary: Add maintenance log (Admin only)
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
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
   *               description:
   *                 type: string
   *               cost:
   *                 type: number
   *               performedBy:
   *                 type: string
   *     responses:
   *       201:
   *         description: Maintenance log added
   */
  async addMaintenance(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const log = await BikeService.addMaintenanceLog(id, req.body);

      await logActivity(
        req.user?.id || null,
        'CREATE',
        'MAINTENANCE',
        log.id,
        `Added maintenance for bike ${id}`,
        { bikeId: id, maintenanceType: log.type, cost: log.cost },
        req
      );

      res.status(201).json({
        success: true,
        message: 'Maintenance log added',
        data: log
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
   * /bikes/{id}/trips:
   *   get:
   *     summary: Get bike trips history (Admin only)
   *     tags: [Bikes]
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
   *         description: Bike trips retrieved
   */
  async getBikeTrips(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      
      // Récupérer le vélo
      const bike = await BikeService.getBikeById(id);
      if (!bike) {
        res.status(404).json({
          success: false,
          message: 'Bike not found'
        });
        return;
      }

      // Récupérer les trajets du vélo avec les informations utilisateur
      const trips = await prisma.ride.findMany({
        where: { bikeId: id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { startTime: 'desc' }
      });

      // Formater les données
      const formattedTrips = trips.map(trip => ({
        id: trip.id,
        startTime: trip.startTime,
        endTime: trip.endTime,
        duration: trip.duration || 0,
        distance: trip.distance || 0,
        cost: trip.cost || 0,
        startLatitude: trip.startLatitude,
        startLongitude: trip.startLongitude,
        endLatitude: trip.endLatitude,
        endLongitude: trip.endLongitude,
        status: trip.status,
        userName: trip.user ? `${trip.user.firstName} ${trip.user.lastName}` : 'Utilisateur inconnu'
      }));

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'BIKE_TRIPS',
        id,
        `Viewed trips for bike ${bike.code}`,
        { bikeCode: bike.code, tripsCount: formattedTrips.length },
        req
      );

      res.json({
        success: true,
        data: {
          trips: formattedTrips,
          bikeName: bike.code
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
   * @swagger
   * /bikes/{id}/maintenance:
   *   get:
   *     summary: Get maintenance history
   *     tags: [Bikes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Maintenance history retrieved
   */
  async getMaintenanceHistory(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await BikeService.getMaintenanceHistory(id, page, limit);

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'MAINTENANCE_HISTORY',
        id,
        `Viewed maintenance history for bike ${id}`,
        { page, limit, count: result.pagination.total },
        req
      );

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
   * /bikes/{id}/stats:
   *   get:
   *     summary: Get bike statistics (Admin only)
   *     tags: [Bikes]
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
   *         description: Statistics retrieved
   */
  async getBikeStats(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const stats = await BikeService.getBikeStats(id);

      await logActivity(
        req.user?.id || null,
        'VIEW',
        'BIKE_STATS',
        id,
        `Viewed statistics for bike ${id}`,
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

  /**
   * @swagger
   * /bikes/reverse-geocode:
   *   post:
   *     summary: Reverse geocode coordinates to get address
   *     tags: [Bikes]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - latitude
   *               - longitude
   *             properties:
   *               latitude:
   *                 type: number
   *                 format: float
   *                 example: 4.0511
   *               longitude:
   *                 type: number
   *                 format: float
   *                 example: 9.7679
   *     responses:
   *       200:
   *         description: Address retrieved successfully
   */
  async reverseGeocode(req: AuthRequest, res: express.Response): Promise<void> {
    try {
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
        return;
      }

      const address = await BikeService.reverseGeocode(latitude, longitude);

      res.json({
        success: true,
        data: { address }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new BikeController();