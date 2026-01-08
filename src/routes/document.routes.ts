import express from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const documentController = new DocumentController();

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

export default router;
