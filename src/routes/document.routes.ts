import express from 'express';
import { DocumentController } from '../controllers/DocumentController';
<<<<<<< HEAD
import { authenticate, authenticateWithPendingVerification, requirePermission } from '../middleware/auth';
=======
import { authenticate } from '../middleware/auth';
>>>>>>> origin/main

const router = express.Router();
const documentController = new DocumentController();

<<<<<<< HEAD
// User routes - autoriser les utilisateurs avec pending_verification pour soumettre leurs documents
router.post('/identity', authenticateWithPendingVerification, documentController.submitIdentityDocument);
router.post('/residence', authenticateWithPendingVerification, documentController.submitResidenceProof);
router.get('/status', authenticateWithPendingVerification, documentController.getUserDocumentsStatus);
router.get('/user/:userId/status', authenticate, requirePermission('users', 'read'), documentController.getUserDocumentsStatusByUserId);

// Admin routes
router.get('/pending', authenticate, requirePermission('users', 'read'), documentController.getPendingDocuments);
router.post('/identity/:documentId/approve', authenticate, requirePermission('users', 'update'), documentController.approveIdentityDocument);
router.post('/identity/:documentId/reject', authenticate, requirePermission('users', 'update'), documentController.rejectIdentityDocument);
router.post('/residence/:proofId/approve', authenticate, requirePermission('users', 'update'), documentController.approveResidenceProof);
router.post('/residence/:proofId/reject', authenticate, requirePermission('users', 'update'), documentController.rejectResidenceProof);
router.post('/verify-account/:userId', authenticate, requirePermission('users', 'update'), documentController.verifyUserAccount);
=======
// User routes
router.post('/identity', authenticate, documentController.submitIdentityDocument);
router.post('/residence', authenticate, documentController.submitResidenceProof);
router.get('/status', authenticate, documentController.getUserDocumentsStatus);
router.get('/user/:userId/status', authenticate, documentController.getUserDocumentsStatusByUserId);

// Admin routes
router.get('/pending', authenticate, documentController.getPendingDocuments);
router.post('/identity/:documentId/approve', authenticate, documentController.approveIdentityDocument);
router.post('/identity/:documentId/reject', authenticate, documentController.rejectIdentityDocument);
router.post('/residence/:proofId/approve', authenticate, documentController.approveResidenceProof);
router.post('/residence/:proofId/reject', authenticate, documentController.rejectResidenceProof);
router.post('/verify-account/:userId', authenticate, documentController.verifyUserAccount);
>>>>>>> origin/main

export default router;
