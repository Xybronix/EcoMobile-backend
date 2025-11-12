"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BikeController_1 = require("../controllers/BikeController");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const router = (0, express_1.Router)();
const bikeController = new BikeController_1.BikeController();
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
router.get('/', auth_1.optionalAuth, validator_1.paginationValidator, validator_1.validate, bikeController.getAllBikes);
/**
 * @route   GET /api/v1/bikes/available
 * @desc    Get available bikes
 * @access  Public
 */
router.get('/available', validator_1.paginationValidator, validator_1.validate, bikeController.getAvailableBikes);
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
router.get('/:id', auth_1.optionalAuth, validator_1.idValidator, validator_1.validate, bikeController.getBikeById);
/**
 * @route   GET /api/v1/bikes/code/:code
 * @desc    Get bike by code or QR code
 * @access  Private
 */
router.get('/code/:code', auth_1.authenticate, bikeController.getBikeByCode);
/**
 * @route   POST /api/v1/bikes
 * @desc    Create bike (admin only)
 * @access  Private/Admin
 */
router.post('/', auth_1.authenticate, (0, auth_1.requirePermission)('bikes', 'create'), validator_1.createBikeValidator, validator_1.validate, bikeController.createBike);
/**
 * @route   PUT /api/v1/bikes/:id
 * @desc    Update bike (admin only)
 * @access  Private/Admin
 */
router.put('/:id', auth_1.authenticate, (0, auth_1.requirePermission)('bikes', 'update'), validator_1.idValidator, validator_1.validate, bikeController.updateBike);
/**
 * @route   DELETE /api/v1/bikes/:id
 * @desc    Delete bike (admin only)
 * @access  Private/Admin
 */
router.delete('/:id', auth_1.authenticate, (0, auth_1.requirePermission)('bikes', 'delete'), validator_1.idValidator, validator_1.validate, bikeController.deleteBike);
/**
 * @route   POST /api/v1/bikes/:id/unlock
 * @desc    Unlock bike
 * @access  Private
 */
router.post('/:id/unlock', auth_1.authenticate, validator_1.idValidator, validator_1.validate, bikeController.unlockBike);
/**
 * @route   POST /api/v1/bikes/:id/lock
 * @desc    Lock bike
 * @access  Private
 */
router.post('/:id/lock', auth_1.authenticate, validator_1.idValidator, validator_1.validate, bikeController.lockBike);
/**
 * @route   POST /api/v1/bikes/:id/maintenance
 * @desc    Add maintenance log (Admin only)
 * @access  Private/Admin
 */
router.post('/:id/maintenance', auth_1.authenticate, (0, auth_1.requirePermission)('maintenance', 'create'), validator_1.idValidator, validator_1.validate, bikeController.addMaintenance);
/**
 * @route   GET /api/v1/bikes/:id/maintenance
 * @desc    Get maintenance history (Admin only)
 * @access  Private
 */
router.get('/:id/maintenance', auth_1.authenticate, (0, auth_1.requirePermission)('maintenance', 'read'), validator_1.idValidator, validator_1.validate, validator_1.paginationValidator, validator_1.validate, bikeController.getMaintenanceHistory);
/**
 * @route   GET /api/v1/bikes/:id/trips
 * @desc    Get bike trips history (Admin only)
 * @access  Private/Admin
 */
router.get('/:id/trips', auth_1.authenticate, (0, auth_1.requirePermission)('bikes', 'read'), validator_1.idValidator, validator_1.validate, bikeController.getBikeTrips);
/**
 * @route   GET /api/v1/bikes/:id/stats
 * @desc    Get bike statistics (Admin only)
 * @access  Private/Admin
 */
router.get('/:id/stats', auth_1.authenticate, (0, auth_1.requirePermission)('bikes', 'read'), validator_1.idValidator, validator_1.validate, bikeController.getBikeStats);
exports.default = router;
//# sourceMappingURL=bike.routes.js.map