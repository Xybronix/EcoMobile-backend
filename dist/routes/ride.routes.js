"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RideController_1 = require("../controllers/RideController");
const auth_1 = require("../middleware/auth");
const validator_1 = require("../middleware/validator");
const router = (0, express_1.Router)();
const rideController = new RideController_1.RideController();
/**
 * @route   POST /api/v1/rides/start
 * @desc    Start a ride
 * @access  Private
 */
router.post('/start', auth_1.authenticate, validator_1.startRideValidator, validator_1.validate, rideController.startRide);
/**
 * @route   POST /api/v1/rides/:id/end
 * @desc    End a ride
 * @access  Private
 */
router.post('/:id/end', auth_1.authenticate, validator_1.idValidator, validator_1.endRideValidator, validator_1.validate, rideController.endRide);
/**
 * @route   POST /api/v1/rides/:id/cancel
 * @desc    Cancel a ride
 * @access  Private
 */
router.post('/:id/cancel', auth_1.authenticate, validator_1.idValidator, validator_1.validate, rideController.cancelRide);
/**
 * @route   GET /api/v1/rides/:id/details
 * @desc    Get ride details with GPS track
 * @access  Private
 */
router.get('/:id/details', auth_1.authenticate, validator_1.idValidator, validator_1.validate, rideController.getRideDetails);
/**
 * @route   GET /api/v1/rides/stats
 * @desc    Get user's ride statistics
 * @access  Private
 */
router.get('/stats', auth_1.authenticate, rideController.getRideStats);
/**
 * @route   GET /api/v1/rides
 * @desc    Get user's rides
 * @access  Private
 */
router.get('/', auth_1.authenticate, rideController.getUserRides);
/**
 * @route   GET /api/v1/rides/active
 * @desc    Get active ride
 * @access  Private
 */
router.get('/active', auth_1.authenticate, rideController.getActiveRide);
exports.default = router;
//# sourceMappingURL=ride.routes.js.map