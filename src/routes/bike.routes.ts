import express from 'express';
import { BikeController } from '../controllers/BikeController';
import { authenticate, requirePermission, optionalAuth } from '../middleware/auth';
import { createBikeValidator, paginationValidator, idValidator, validate } from '../middleware/validator';

const router = express.Router();
const bikeController = new BikeController();

/**
 * @route   GET /api/v1/bikes/public
 * @desc    Get bikes for public
 * @access  Public
 */
router.get('/public', paginationValidator, validate, bikeController.getPublicBikes);

/**
 * @route   POST /api/v1/bikes/reverse-geocode
 * @desc    Reverse geocode coordinates to get address
 * @access  Public
 */
router.post('/reverse-geocode', bikeController.reverseGeocode);

/**
 * @route   GET /api/v1/bikes
 * @desc    Get all bikes
 * @access  Public/Private
 */
router.get('/', optionalAuth, paginationValidator, validate, bikeController.getAllBikes);

/**
 * @route   GET /api/v1/bikes/available
 * @desc    Get available bikes
 * @access  Public
 */
router.get('/available', paginationValidator, validate, bikeController.getAvailableBikes);

/**
 * @route   GET /api/v1/bikes/nearby
 * @desc    Get nearby bikes
 * @access  Public
 */
router.get('/nearby', bikeController.getNearbyBikes);

/**
 * @route   GET /api/v1/bikes/areas/default
 * @desc    Get default areas (Cameroon neighborhoods)
 * @access  Public
 */
router.get('/areas/default', bikeController.getDefaultAreas);

/**
 * @route   POST /api/v1/bikes/areas/search
 * @desc    Search areas using Google Places
 * @access  Public
 */
router.post('/areas/search', bikeController.searchAreas);

/**
 * @route   GET /api/v1/bikes/:id
 * @desc    Get bike by ID
 * @access  Public/Private
 */
router.get('/:id', optionalAuth, idValidator, validate, bikeController.getBikeById);

/**
 * @route   GET /api/v1/bikes/code/:code
 * @desc    Get bike by code or QR code
 * @access  Private
 */
router.get('/code/:code', authenticate, bikeController.getBikeByCode);

/**
 * @route   POST /api/v1/bikes
 * @desc    Create bike (admin only)
 * @access  Private/Admin
 */
router.post('/', authenticate, requirePermission('bikes', 'create'), createBikeValidator, validate, bikeController.createBike);

/**
 * @route   PUT /api/v1/bikes/:id
 * @desc    Update bike (admin only)
 * @access  Private/Admin
 */
router.put('/:id', authenticate, requirePermission('bikes', 'update'), idValidator, validate, bikeController.updateBike);

/**
 * @route   DELETE /api/v1/bikes/:id
 * @desc    Delete bike (admin only)
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, requirePermission('bikes', 'delete'), idValidator, validate, bikeController.deleteBike);

/**
 * @route   POST /api/v1/bikes/:id/unlock
 * @desc    Unlock bike
 * @access  Private
 */
router.post('/:id/unlock', authenticate, idValidator, validate, bikeController.unlockBike);

/**
 * @route   POST /api/v1/bikes/:id/lock
 * @desc    Lock bike
 * @access  Private
 */
router.post('/:id/lock', authenticate, idValidator, validate, bikeController.lockBike);

/**
 * @route   POST /api/v1/bikes/:id/maintenance
 * @desc    Add maintenance log (Admin only)
 * @access  Private/Admin
 */
router.post('/:id/maintenance', authenticate, requirePermission('maintenance', 'create'), idValidator, validate, bikeController.addMaintenance);

/**
 * @route   GET /api/v1/bikes/:id/maintenance
 * @desc    Get maintenance history (Admin only)
 * @access  Private
 */
router.get(
  '/:id/maintenance', authenticate, requirePermission('maintenance', 'read'), idValidator, validate, paginationValidator, validate, bikeController.getMaintenanceHistory);

/**
 * @route   GET /api/v1/bikes/:id/trips
 * @desc    Get bike trips history (Admin only)
 * @access  Private/Admin
 */
router.get('/:id/trips', authenticate, requirePermission('bikes', 'read'), idValidator, validate, bikeController.getBikeTrips);

/**
 * @route   GET /api/v1/bikes/:id/stats
 * @desc    Get bike statistics (Admin only)
 * @access  Private/Admin
 */
router.get('/:id/stats', authenticate, requirePermission('bikes', 'read'), idValidator, validate, bikeController.getBikeStats);

/**
 * @route   POST /api/v1/bikes/sync-gps
 * @desc    Sync all bikes with GPS data (Admin only)
 * @access  Private/Admin
 */
router.post('/sync-gps', authenticate, requirePermission('bikes', 'update'), bikeController.syncGpsData);

/**
 * @route   GET /api/v1/bikes/realtime-positions
 * @desc    Get real-time positions of all bikes (Admin only)
 * @access  Private/Admin
 */
router.get('/realtime-positions', authenticate, requirePermission('bikes', 'read'), bikeController.getRealtimePositions);

export default router;