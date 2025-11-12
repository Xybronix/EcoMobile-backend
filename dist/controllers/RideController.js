"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideController = void 0;
const auth_1 = require("../middleware/auth");
const services_1 = require("../services");
const errorHandler_1 = require("../middleware/errorHandler");
const locales_1 = require("../locales");
class RideController {
    constructor() {
        /**
         * @swagger
         * /rides/start:
         *   post:
         *     summary: Démarrer un nouveau trajet
         *     tags: [Rides]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - bikeId
         *               - startLocation
         *             properties:
         *               bikeId:
         *                 type: string
         *                 description: ID du vélo pour démarrer le trajet
         *                 example: "bike_123456"
         *               startLocation:
         *                 type: object
         *                 required:
         *                   - latitude
         *                   - longitude
         *                   - address
         *                 properties:
         *                   latitude:
         *                     type: number
         *                     format: float
         *                     example: 4.0511
         *                   longitude:
         *                     type: number
         *                     format: float
         *                     example: 9.7679
         *                   address:
         *                     type: string
         *                     example: "Carrefour Etoa Meki, Yaoundé, Cameroun"
         *     responses:
         *       201:
         *         description: Trajet démarré avec succès
         */
        this.startRide = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const language = req.language || 'fr';
            const userId = req.user.id;
            const { bikeId, startLocation } = req.body;
            const ride = await this.rideService.startRide(userId, bikeId, startLocation, language);
            await (0, auth_1.logActivity)(userId, 'CREATE', 'RIDE', ride.id, `Started ride with bike ${bikeId}`, { rideId: ride.id, bikeId, startLocation }, req);
            res.status(201).json({
                success: true,
                message: (0, locales_1.t)('ride.started', language),
                data: ride
            });
        });
        /**
         * @swagger
         * /rides/{id}/end:
         *   put:
         *     summary: Terminer un trajet actif
         *     tags: [Rides]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: ID du trajet
         *         example: "ride_123456"
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required:
         *               - endLocation
         *             properties:
         *               endLocation:
         *                 type: object
         *                 required:
         *                   - latitude
         *                   - longitude
         *                   - address
         *                 properties:
         *                   latitude:
         *                     type: number
         *                     format: float
         *                     example: 4.0611
         *                   longitude:
         *                     type: number
         *                     format: float
         *                     example: 9.7779
         *                   address:
         *                     type: string
         *                     example: "Marché Central, Yaoundé, Cameroun"
         *     responses:
         *       200:
         *         description: Trajet terminé avec succès
         */
        this.endRide = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const language = req.language || 'fr';
            const { id } = req.params;
            const { endLocation } = req.body;
            const ride = await this.rideService.endRide(id, endLocation, language);
            await (0, auth_1.logActivity)(req.user.id, 'UPDATE', 'RIDE', id, `Ended ride with cost: ${ride.cost} FCFA`, { rideId: id, endLocation, cost: ride.cost, duration: ride.duration }, req);
            res.status(200).json({
                success: true,
                message: (0, locales_1.t)('ride.ended', language),
                data: ride
            });
        });
        /**
         * @swagger
         * /rides/{id}/cancel:
         *   post:
         *     summary: Cancel an active ride
         *     tags: [Rides]
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
         *         description: Ride cancelled successfully
         */
        this.cancelRide = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const language = req.language || 'fr';
            const userId = req.user.id;
            const { id } = req.params;
            const ride = await this.rideService.cancelRide(id, userId, language);
            await (0, auth_1.logActivity)(userId, 'UPDATE', 'RIDE', id, 'Cancelled ride', { rideId: id, previousStatus: 'IN_PROGRESS', newStatus: 'CANCELLED' }, req);
            res.status(200).json({
                success: true,
                message: (0, locales_1.t)('ride.cancelled', language),
                data: ride
            });
        });
        /**
         * @swagger
         * /rides/{id}/details:
         *   get:
         *     summary: Get detailed ride information with GPS track
         *     tags: [Rides]
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
         *         description: Ride details retrieved successfully
         */
        this.getRideDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const ride = await this.rideService.getRideById(id);
            if (!ride) {
                return res.status(404).json({
                    success: false,
                    message: 'Ride not found'
                });
            }
            await (0, auth_1.logActivity)(req.user.id, 'VIEW', 'RIDE', id, 'Viewed ride details', { rideId: id, status: ride.status }, req);
            return res.status(200).json({
                success: true,
                data: ride
            });
        });
        /**
         * @swagger
         * /rides/stats:
         *   get:
         *     summary: Get user's ride statistics
         *     tags: [Rides]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Ride statistics retrieved successfully
         */
        this.getRideStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const stats = await this.rideService.getRideStats(userId);
            await (0, auth_1.logActivity)(userId, 'VIEW', 'RIDE_STATS', '', 'Viewed ride statistics', { totalRides: stats.totalRides, totalDistance: stats.totalDistance }, req);
            res.status(200).json({
                success: true,
                data: stats
            });
        });
        /**
         * @swagger
         * /rides/history:
         *   get:
         *     summary: Obtenir l'historique des trajets de l'utilisateur
         *     tags: [Rides]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *           minimum: 1
         *           default: 1
         *         description: Numéro de page pour la pagination
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           minimum: 1
         *           maximum: 50
         *           default: 10
         *         description: Nombre de trajets par page
         *     responses:
         *       200:
         *         description: Historique des trajets récupéré avec succès
         */
        this.getUserRides = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const rides = await this.rideService.getUserRides(userId, page, limit);
            await (0, auth_1.logActivity)(userId, 'VIEW', 'RIDE_HISTORY', '', `Viewed ride history (page ${page})`, { page, limit, total: rides.rides.length }, req);
            res.status(200).json({
                success: true,
                data: rides
            });
        });
        /**
         * @swagger
         * /rides/active:
         *   get:
         *     summary: Obtenir le trajet actif de l'utilisateur
         *     tags: [Rides]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Trajet actif récupéré avec succès
         */
        this.getActiveRide = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const language = req.language || 'fr';
            const userId = req.user.id;
            const ride = await this.rideService.getActiveRide(userId, language);
            await (0, auth_1.logActivity)(userId, 'VIEW', 'ACTIVE_RIDE', ride?.id || '', ride ? 'Viewed active ride' : 'No active ride found', { hasActiveRide: !!ride }, req);
            res.status(200).json({
                success: true,
                data: ride
            });
        });
        this.rideService = new services_1.RideService();
    }
}
exports.RideController = RideController;
//# sourceMappingURL=RideController.js.map