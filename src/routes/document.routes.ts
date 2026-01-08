import express from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = express.Router();
const documentController = new DocumentController();

// User routes
router.post('/identity', authenticate, documentController.submitIdentityDocument);
router.post('/residence', authenticate, documentController.submitResidenceProof);
router.get('/status', authenticate, documentController.getUserDocumentsStatus);
router.get('/user/:userId/status', authenticate, requirePermission('users', 'read'), documentController.getUserDocumentsStatusByUserId);

// Admin routes
router.get('/pending', authenticate, requirePermission('users', 'read'), documentController.getPendingDocuments);
router.post('/identity/:documentId/approve', authenticate, requirePermission('users', 'update'), documentController.approveIdentityDocument);
router.post('/identity/:documentId/reject', authenticate, requirePermission('users', 'update'), documentController.rejectIdentityDocument);
router.post('/residence/:proofId/approve', authenticate, requirePermission('users', 'update'), documentController.approveResidenceProof);
router.post('/residence/:proofId/reject', authenticate, requirePermission('users', 'update'), documentController.rejectResidenceProof);
router.post('/verify-account/:userId', authenticate, requirePermission('users', 'update'), documentController.verifyUserAccount);

export default router;
