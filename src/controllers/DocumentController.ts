import express from 'express';
import { AuthRequest, logActivity } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { DocumentService } from '../services/DocumentService';
import { t } from '../locales';

export class DocumentController {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * Submit identity document
   */
  submitIdentityDocument = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const result = await this.documentService.submitIdentityDocument(req.user!.id, req.body);

    await logActivity(
      req.user!.id,
      'CREATE',
      'IDENTITY_DOCUMENT',
      result.id,
      'Identity document submitted',
      { documentType: req.body.documentType },
      req
    );

    res.status(201).json({
      success: true,
      message: t('document.submitted', language),
      data: result
    });
  });

  /**
   * Submit residence proof
   */
  submitResidenceProof = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const result = await this.documentService.submitResidenceProof(req.user!.id, req.body);

    await logActivity(
      req.user!.id,
      'CREATE',
      'RESIDENCE_PROOF',
      result.id,
      'Residence proof submitted',
      { proofType: req.body.proofType },
      req
    );

    res.status(201).json({
      success: true,
      message: t('document.submitted', language),
      data: result
    });
  });

  /**
   * Submit activity location proof
   */
  submitActivityLocationProof = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const result = await this.documentService.submitActivityLocationProof(req.user!.id, req.body);

    await logActivity(
      req.user!.id,
      'CREATE',
      'ACTIVITY_LOCATION_PROOF',
      result.id,
      'Activity location proof submitted',
      { proofType: req.body.proofType },
      req
    );

    res.status(201).json({
      success: true,
      message: t('document.submitted', language),
      data: result
    });
  });

  /**
   * Get user documents status
   */
  getUserDocumentsStatus = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const result = await this.documentService.getUserDocumentsStatus(req.user!.id);

    res.status(200).json({
      success: true,
      message: t('document.status_retrieved', language),
      data: result
    });
  });

  /**
   * Get user documents status by userId (admin)
   */
  getUserDocumentsStatusByUserId = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const { userId } = req.params;
    const result = await this.documentService.getUserDocumentsStatus(userId);

    res.status(200).json({
      success: true,
      message: t('document.status_retrieved', language),
      data: result
    });
  });

  /**
   * Get pending documents (admin)
   */
  getPendingDocuments = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await this.documentService.getPendingDocuments(page, limit);

    res.status(200).json({
      success: true,
      message: t('document.pending_retrieved', language),
      data: result
    });
  });

  /**
   * Approve identity document (admin)
   */
  approveIdentityDocument = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const { documentId } = req.params;
    
    const result = await this.documentService.approveIdentityDocument(documentId, req.user!.id);

    await logActivity(
      req.user!.id,
      'APPROVE',
      'IDENTITY_DOCUMENT',
      documentId,
      'Identity document approved',
      { documentId },
      req
    );

    res.status(200).json({
      success: true,
      message: t('document.approved', language),
      data: result
    });
  });

  /**
   * Reject identity document (admin)
   */
  rejectIdentityDocument = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const { documentId } = req.params;
    const { reason } = req.body;
    
    const result = await this.documentService.rejectIdentityDocument(documentId, req.user!.id, reason);

    await logActivity(
      req.user!.id,
      'REJECT',
      'IDENTITY_DOCUMENT',
      documentId,
      'Identity document rejected',
      { documentId, reason },
      req
    );

    res.status(200).json({
      success: true,
      message: t('document.rejected', language),
      data: result
    });
  });

  /**
   * Approve residence proof (admin)
   */
  approveResidenceProof = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const { proofId } = req.params;
    
    const result = await this.documentService.approveResidenceProof(proofId, req.user!.id);

    await logActivity(
      req.user!.id,
      'APPROVE',
      'RESIDENCE_PROOF',
      proofId,
      'Residence proof approved',
      { proofId },
      req
    );

    res.status(200).json({
      success: true,
      message: t('document.approved', language),
      data: result
    });
  });

  /**
   * Reject residence proof (admin)
   */
  rejectResidenceProof = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const { proofId } = req.params;
    const { reason } = req.body;
    
    const result = await this.documentService.rejectResidenceProof(proofId, req.user!.id, reason);

    await logActivity(
      req.user!.id,
      'REJECT',
      'RESIDENCE_PROOF',
      proofId,
      'Residence proof rejected',
      { proofId, reason },
      req
    );

    res.status(200).json({
      success: true,
      message: t('document.rejected', language),
      data: result
    });
  });

  /**
   * Approve activity location proof (admin)
   */
  approveActivityLocationProof = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const { proofId } = req.params;
    
    const result = await this.documentService.approveActivityLocationProof(proofId, req.user!.id);

    await logActivity(
      req.user!.id,
      'APPROVE',
      'ACTIVITY_LOCATION_PROOF',
      proofId,
      'Activity location proof approved',
      { proofId },
      req
    );

    res.status(200).json({
      success: true,
      message: t('document.approved', language),
      data: result
    });
  });

  /**
   * Reject activity location proof (admin)
   */
  rejectActivityLocationProof = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const { proofId } = req.params;
    const { reason } = req.body;
    
    const result = await this.documentService.rejectActivityLocationProof(proofId, req.user!.id, reason);

    await logActivity(
      req.user!.id,
      'REJECT',
      'ACTIVITY_LOCATION_PROOF',
      proofId,
      'Activity location proof rejected',
      { proofId, reason },
      req
    );

    res.status(200).json({
      success: true,
      message: t('document.rejected', language),
      data: result
    });
  });

  /**
   * Verify user account (admin)
   */
  verifyUserAccount = asyncHandler(async (req: AuthRequest, res: express.Response) => {
    const language = req.language || 'fr';
    const { userId } = req.params;
    
    const result = await this.documentService.verifyUserAccount(userId, req.user!.id);

    await logActivity(
      req.user!.id,
      'VERIFY',
      'USER_ACCOUNT',
      userId,
      'User account verified',
      { userId },
      req
    );

    res.status(200).json({
      success: true,
      message: t('user.account_verified', language),
      data: result
    });
  });
}
