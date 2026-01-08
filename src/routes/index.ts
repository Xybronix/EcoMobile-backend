import express from 'express';
import publicRoutes from './public.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import bikeRoutes from './bike.routes';
import bikeRequestRoutes from './bikeRequests.route';
import reservationtRoutes from './reservation.route';
import incidentRoutes from './incident.routes';
import rideRoutes from './ride.routes';
import walletRoutes from './wallet.routes';
import subscriptionRoutes from './subscription.routes';
import adminRoutes from './admin.routes';
import chatRoutes from './chat.routes';
import notificationRoutes from './notification.routes';
import monitoringRoutes from './monitoring.routes';
import documentRoutes from './document.routes';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: '🚲 EcoMobile API - Welcome!',
    version: 'v1',
    endpoints: {
      health: '/api/v1/health',
      docs: '/api-docs'
    }
  });
});

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'FreeBike API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/bikes', bikeRoutes);
router.use('/bike-requests', bikeRequestRoutes);
router.use('/reservations', reservationtRoutes);
router.use('/incidents', incidentRoutes)
router.use('/rides', rideRoutes);
router.use('/wallet', walletRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/admin', adminRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/documents', documentRoutes);

export default router;
