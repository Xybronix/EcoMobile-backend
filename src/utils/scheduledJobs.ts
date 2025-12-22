import cron from 'node-cron';
import ReservationService from '../services/ReservationService';

/**
 * Initialiser les jobs planifiés
 */
export function initScheduledJobs() {
  // Nettoyer les réservations expirées toutes les 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[CRON] Vérification des réservations expirées...');
      const result = await ReservationService.cleanupExpiredReservations();
      if (result.cancelled > 0) {
        console.log(`[CRON] ${result.cancelled} réservation(s) annulée(s)`);
      }
    } catch (error) {
      console.error('[CRON] Erreur lors du nettoyage des réservations:', error);
    }
  });

  console.log('[CRON] Jobs planifiés initialisés');
}