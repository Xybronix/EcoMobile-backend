import express from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { authenticate, authenticateWithPendingVerification, requirePermission } from '../middleware/auth';

const router = express.Router();
const documentController = new DocumentController();

// User routes - autoriser les utilisateurs avec pending_verification pour soumettre leurs documents
router.post('/identity', authenticateWithPendingVerification, documentController.submitIdentityDocument);
router.post('/residence', authenticateWithPendingVerification, documentController.submitResidenceProof);
router.post('/activity-location', authenticateWithPendingVerification, documentController.submitActivityLocationProof);
router.get('/status', authenticateWithPendingVerification, documentController.getUserDocumentsStatus);
router.get('/user/:userId/status', authenticate, requirePermission('users', 'read'), documentController.getUserDocumentsStatusByUserId);

// Admin routes
router.get('/pending', authenticate, requirePermission('users', 'read'), documentController.getPendingDocuments);
router.post('/identity/:documentId/approve', authenticate, requirePermission('users', 'update'), documentController.approveIdentityDocument);
router.post('/identity/:documentId/reject', authenticate, requirePermission('users', 'update'), documentController.rejectIdentityDocument);
router.post('/residence/:proofId/approve', authenticate, requirePermission('users', 'update'), documentController.approveResidenceProof);
router.post('/residence/:proofId/reject', authenticate, requirePermission('users', 'update'), documentController.rejectResidenceProof);
router.post('/activity-location/:proofId/approve', authenticate, requirePermission('users', 'update'), documentController.approveActivityLocationProof);
router.post('/activity-location/:proofId/reject', authenticate, requirePermission('users', 'update'), documentController.rejectActivityLocationProof);
router.post('/verify-account/:userId', authenticate, requirePermission('users', 'update'), documentController.verifyUserAccount);

export default router;
