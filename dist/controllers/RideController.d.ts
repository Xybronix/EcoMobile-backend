import { Response } from 'express';
export declare class RideController {
    private rideService;
    constructor();
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
    startRide: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
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
    endRide: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
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
    cancelRide: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
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
    getRideDetails: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
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
    getRideStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
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
    getUserRides: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
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
    getActiveRide: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=RideController.d.ts.map