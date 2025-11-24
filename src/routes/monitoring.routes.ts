import express from 'express';
import BikeMonitoringService from '../services/BikeMonitoringService';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/v1/monitoring/suspicious-movements
 * @desc    Get current suspicious bike movements (Admin only)
 * @access  Private/Admin
 */
router.get('/suspicious-movements', 
  authenticate, 
  requirePermission('monitoring', 'read'), 
  async (_req, res) => {
    try {
      const movements = await BikeMonitoringService.checkSuspiciousMovements();
      
      res.json({
        success: true,
        data: movements,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/v1/monitoring/handle-alert
 * @desc    Mark security alert as handled (Admin only)
 * @access  Private/Admin
 */
router.post('/handle-alert',
  authenticate,
  requirePermission('monitoring', 'update'),
  async (req, res) => {
    try {
      const { bikeId, action, note } = req.body;
      const adminId = req.user!.id;

      await BikeMonitoringService.markAlertAsHandled(bikeId, adminId, action, note);

      res.json({
        success: true,
        message: 'Alerte marquée comme traitée'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/v1/monitoring/security-alerts
 * @desc    Get recent security alerts (Admin only)
 * @access  Private/Admin
 */
router.get('/security-alerts',
  authenticate,
  requirePermission('monitoring', 'read'),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const alerts = await BikeMonitoringService.getRecentSecurityAlerts(limit);

      res.json({
        success: true,
        data: alerts
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/v1/monitoring/start
 * @desc    Start bike monitoring (Admin only)
 * @access  Private/Admin
 */
router.post('/start',
  authenticate,
  requirePermission('monitoring', 'update'),
  async (req, res) => {
    try {
      const { interval = 60000 } = req.body; // Default 1 minute

      BikeMonitoringService.startMonitoring(interval);

      res.json({
        success: true,
        message: 'Surveillance des vélos démarrée'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/v1/monitoring/stop
 * @desc    Stop bike monitoring (Admin only)  
 * @access  Private/Admin
 */
router.post('/stop',
  authenticate,
  requirePermission('monitoring', 'update'),
  async (_req, res) => {
    try {
      BikeMonitoringService.stopMonitoring();

      res.json({
        success: true,
        message: 'Surveillance des vélos arrêtée'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;