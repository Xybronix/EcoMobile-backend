import express from 'express';
import ReservationController from '../controllers/ReservationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/v1/reservations
 * @desc    Get user's reservations
 * @access  Private
 */
router.get('/', authenticate, ReservationController.getUserReservations);

/**
 * @route   POST /api/v1/reservations
 * @desc    Create new reservation
 * @access  Private
 */
router.post('/', authenticate, ReservationController.createReservation);

/**
 * @route   PUT /api/v1/reservations/:id
 * @desc    Update reservation
 * @access  Private
 */
router.put('/:id', authenticate, ReservationController.updateReservation);

/**
 * @route   DELETE /api/v1/reservations/:id
 * @desc    Cancel reservation
 * @access  Private
 */
router.delete('/:id', authenticate, ReservationController.cancelReservation);

/**
 * @route   POST /api/v1/unlock-requests
 * @desc    Request bike unlock
 * @access  Private
 */
router.post('/unlock-requests', authenticate, ReservationController.requestUnlock);

/**
 * @route   POST /api/v1/lock-requests
 * @desc    Request bike lock
 * @access  Private
 */
router.post('/lock-requests', authenticate, ReservationController.requestLock);

export default router;