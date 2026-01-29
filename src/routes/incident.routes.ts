import express from 'express';
import IncidentController from '../controllers/IncidentController';
import { authenticate, requirePermission } from '../middleware/auth';
import { incidentValidator, idValidator, validate } from '../middleware/validator';

const router = express.Router();

/**
 * @route   GET /api/v1/incidents
 * @desc    Get user's incidents
 * @access  Private
 */
router.get('/', authenticate, IncidentController.getUserIncidents);

/**
 * @route   GET /api/v1/incidents/:id
 * @desc    Get incident by ID (user can only see their own)
 * @access  Private
 */
router.get('/:id', authenticate, idValidator, validate, IncidentController.getIncidentById);

/**
 * @route   POST /api/v1/incidents
 * @desc    Create new incident
 * @access  Private
 */
router.post('/', authenticate, incidentValidator, validate, IncidentController.createIncident);

/**
 * @route   PUT /api/v1/incidents/:id
 * @desc    Update incident (user can only update their own)
 * @access  Private
 */
router.put('/:id', authenticate, idValidator, validate, IncidentController.updateIncident);

/**
 * @route   DELETE /api/v1/incidents/:id
 * @desc    Delete incident (user can only delete their own if OPEN status)
 * @access  Private
 */
router.delete('/:id', authenticate, idValidator, validate, IncidentController.deleteIncident);

/**
 * @route   POST /api/v1/incidents/admin/charge
 * @desc    Créer une charge/incident affectée par l'admin
 * @access  Private/Admin
 */
router.post('/admin/charge', authenticate, requirePermission('incidents', 'create'), IncidentController.createAdminCharge);

/**
 * @route   PUT /api/v1/incidents/admin/charge/:id
 * @desc    Modifier une charge admin (super admin ou créateur uniquement)
 * @access  Private/Admin
 */
router.put('/admin/charge/:id', authenticate, requirePermission('incidents', 'update'), idValidator, validate, IncidentController.updateAdminCharge);

/**
 * @route   DELETE /api/v1/incidents/admin/charge/:id
 * @desc    Supprimer une charge admin (super admin ou créateur uniquement)
 * @access  Private/Admin
 */
router.delete('/admin/charge/:id', authenticate, requirePermission('incidents', 'delete'), idValidator, validate, IncidentController.deleteAdminCharge);

export default router;