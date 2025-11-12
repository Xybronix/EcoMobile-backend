import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class BikeController {
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
    getAllBikes(req: AuthRequest, res: Response): Promise<void>;
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
    getAvailableBikes(req: AuthRequest, res: Response): Promise<void>;
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
    getNearbyBikes(req: AuthRequest, res: Response): Promise<void>;
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
    getDefaultAreas(_req: AuthRequest, res: Response): Promise<void>;
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
    searchAreas(req: AuthRequest, res: Response): Promise<void>;
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
    syncGpsData(req: AuthRequest, res: Response): Promise<void>;
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
    getBikeTrack(req: AuthRequest, res: Response): Promise<void>;
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
    getBikeMileage(req: AuthRequest, res: Response): Promise<void>;
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
    getBikeById(req: AuthRequest, res: Response): Promise<void>;
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
    getBikeByCode(req: AuthRequest, res: Response): Promise<void>;
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
    createBike(req: AuthRequest, res: Response): Promise<void>;
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
    updateBike(req: AuthRequest, res: Response): Promise<void>;
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
    deleteBike(req: AuthRequest, res: Response): Promise<void>;
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
    unlockBike(req: AuthRequest, res: Response): Promise<void>;
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
    lockBike(req: AuthRequest, res: Response): Promise<void>;
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
    addMaintenance(req: AuthRequest, res: Response): Promise<void>;
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
    getBikeTrips(req: AuthRequest, res: Response): Promise<void>;
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
    getMaintenanceHistory(req: AuthRequest, res: Response): Promise<void>;
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
    getBikeStats(req: AuthRequest, res: Response): Promise<void>;
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
    reverseGeocode(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: BikeController;
export default _default;
//# sourceMappingURL=BikeController.d.ts.map