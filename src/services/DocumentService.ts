import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { t } from '../locales';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface IdentityDocumentData {
  documentType: 'CNI' | 'RECEPISSE';
  frontImage: string; // Base64 or file path
  backImage?: string;
  selfieImage?: string; // Base64 photo/vidéo selfie
}

export interface ResidenceProofData {
  proofType: 'DOCUMENT' | 'MAP_COORDINATES';
  documentFile?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  details?: string;
}

export interface ActivityLocationProofData {
  proofType: 'DOCUMENT' | 'MAP_COORDINATES';
  documentFile?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  details?: string;
}

export class DocumentService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create uploads directory:', error);
    }
  }

  /**
   * Save base64 image or video to file
   */
  private async saveImage(base64Data: string, userId: string, type: string, side: 'front' | 'back' | 'selfie'): Promise<string> {
    // Handle file:// URIs (for videos from mobile)
    if (base64Data.startsWith('file://')) {
      // This is a file URI from mobile, we need to read the file
      // For now, we'll expect base64, but we can enhance this later
      throw new AppError(t('error.document.file_uri_not_supported', 'fr'), 400);
    }

    // Handle base64 data (images or videos)
    const base64Match = base64Data.match(/^data:(image|video)\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      // If it's not base64, try to handle it as a URL or return as-is
      if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
        return base64Data; // Return URL as-is
      }
      throw new AppError(t('error.document.invalid_image_format', 'fr'), 400);
    }

    const mediaType = base64Match[1]; // 'image' or 'video'
    const extension = base64Match[2];
    const mediaData = base64Match[3];
    const buffer = Buffer.from(mediaData, 'base64');
    
    // Determine file extension
    let fileExtension = extension;
    if (mediaType === 'video') {
      // Map common video MIME types to extensions
      const videoExtensions: { [key: string]: string } = {
        'mp4': 'mp4',
        'quicktime': 'mov',
        'x-msvideo': 'avi',
        'webm': 'webm',
      };
      fileExtension = videoExtensions[extension] || 'mp4';
    } else {
      // Map common image MIME types to extensions
      const imageExtensions: { [key: string]: string } = {
        'jpeg': 'jpg',
        'jpg': 'jpg',
        'png': 'png',
        'gif': 'gif',
        'webp': 'webp',
      };
      fileExtension = imageExtensions[extension] || 'jpg';
    }
    
    const filename = `${userId}_${type}_${side}_${Date.now()}.${fileExtension}`;
    const filepath = path.join(this.uploadsDir, filename);

    await fs.writeFile(filepath, buffer);
    return `/uploads/documents/${filename}`;
  }

  /**
   * Submit identity document
   */
  async submitIdentityDocument(userId: string, data: IdentityDocumentData): Promise<any> {
    // Check if user already has a pending or approved document of this type
    const existing = await prisma.identityDocument.findFirst({
      where: {
        userId,
        documentType: data.documentType,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existing && existing.status === 'APPROVED') {
      throw new AppError(t('error.document_already_approved', 'fr'), 400);
    }

    // Save images
    const frontImagePath = await this.saveImage(data.frontImage, userId, data.documentType.toLowerCase(), 'front');
    const backImagePath = data.backImage 
      ? await this.saveImage(data.backImage, userId, data.documentType.toLowerCase(), 'back')
      : null;
    const selfieImagePath = data.selfieImage
      ? await this.saveImage(data.selfieImage, userId, data.documentType.toLowerCase(), 'selfie')
      : null;

    // If existing pending document, update it; otherwise create new
    if (existing && existing.status === 'PENDING') {
      // Delete old images
      if (existing.frontImage) {
        try {
          await fs.unlink(path.join(process.cwd(), 'public', existing.frontImage));
        } catch {}
      }
      if (existing.backImage) {
        try {
          await fs.unlink(path.join(process.cwd(), 'public', existing.backImage));
        } catch {}
      }
      if (existing.selfieImage) {
        try {
          await fs.unlink(path.join(process.cwd(), 'public', existing.selfieImage));
        } catch {}
      }

      return await prisma.identityDocument.update({
        where: { id: existing.id },
        data: {
          frontImage: frontImagePath,
          backImage: backImagePath,
          selfieImage: selfieImagePath,
          status: 'PENDING',
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
          submittedAt: new Date()
        }
      });
    }

    return await prisma.identityDocument.create({
      data: {
        userId,
        documentType: data.documentType,
        frontImage: frontImagePath,
        backImage: backImagePath,
        selfieImage: selfieImagePath,
        status: 'PENDING'
      }
    });
  }

  /**
   * Submit residence proof
   */
  async submitResidenceProof(userId: string, data: ResidenceProofData): Promise<any> {
    // Check if user already has a pending or approved proof
    const existing = await prisma.residenceProof.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existing && existing.status === 'APPROVED') {
      throw new AppError(t('error.residence_proof_already_approved', 'fr'), 400);
    }

    let documentFile: string | null = null;
    if (data.documentFile) {
      documentFile = await this.saveImage(data.documentFile, userId, 'document', 'front');
    }

    // If existing pending proof, update it; otherwise create new
    if (existing && existing.status === 'PENDING') {
      // Delete old document if exists
      if (existing.documentFile) {
        try {
          await fs.unlink(path.join(process.cwd(), 'public', existing.documentFile));
        } catch {}
      }

      return await prisma.residenceProof.update({
        where: { id: existing.id },
        data: {
          proofType: data.proofType,
          documentFile,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          details: data.details,
          status: 'PENDING',
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
          submittedAt: new Date()
        }
      });
    }

    return await prisma.residenceProof.create({
      data: {
        userId,
        proofType: data.proofType,
        documentFile,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        details: data.details,
        status: 'PENDING'
      }
    });
  }

  /**
   * Submit activity location proof
   */
  async submitActivityLocationProof(userId: string, data: ActivityLocationProofData): Promise<any> {
    // Check if user already has a pending or approved proof
    const existing = await prisma.activityLocationProof.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existing && existing.status === 'APPROVED') {
      throw new AppError(t('error.activity_location_proof_already_approved', 'fr'), 400);
    }

    let documentFile: string | null = null;
    if (data.documentFile) {
      documentFile = await this.saveImage(data.documentFile, userId, 'activity_location', 'front');
    }

    // If existing pending proof, update it; otherwise create new
    if (existing && existing.status === 'PENDING') {
      // Delete old document if exists
      if (existing.documentFile) {
        try {
          await fs.unlink(path.join(process.cwd(), 'public', existing.documentFile));
        } catch {}
      }

      return await prisma.activityLocationProof.update({
        where: { id: existing.id },
        data: {
          proofType: data.proofType,
          documentFile,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          details: data.details,
          status: 'PENDING',
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
          submittedAt: new Date()
        }
      });
    }

    return await prisma.activityLocationProof.create({
      data: {
        userId,
        proofType: data.proofType,
        documentFile,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        details: data.details,
        status: 'PENDING'
      }
    });
  }

  /**
   * Get user documents status
   */
  async getUserDocumentsStatus(userId: string): Promise<any> {
    const [identityDocuments, residenceProof, activityLocationProof] = await Promise.all([
      prisma.identityDocument.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' }
      }),
      prisma.residenceProof.findFirst({
        where: { userId },
        orderBy: { submittedAt: 'desc' }
      }),
      prisma.activityLocationProof.findFirst({
        where: { userId },
        orderBy: { submittedAt: 'desc' }
      })
    ]);

    return {
      identityDocuments,
      residenceProof,
      activityLocationProof,
      allDocumentsSubmitted: identityDocuments.length > 0 && residenceProof !== null && activityLocationProof !== null,
      allDocumentsApproved: 
        identityDocuments.length > 0 &&
        identityDocuments.every(doc => doc.status === 'APPROVED') &&
        residenceProof !== null &&
        residenceProof.status === 'APPROVED' &&
        activityLocationProof !== null &&
        activityLocationProof.status === 'APPROVED'
    };
  }

  /**
   * Get all pending documents (admin)
   */
  async getPendingDocuments(page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;

    const [identityDocuments, residenceProofs, activityLocationProofs, total] = await Promise.all([
      prisma.identityDocument.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' }
      }),
      prisma.residenceProof.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' }
      }),
      prisma.activityLocationProof.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' }
      }),
      Promise.all([
        prisma.identityDocument.count({ where: { status: 'PENDING' } }),
        prisma.residenceProof.count({ where: { status: 'PENDING' } }),
        prisma.activityLocationProof.count({ where: { status: 'PENDING' } })
      ]).then(([idCount, rpCount, alpCount]) => idCount + rpCount + alpCount)
    ]);

    return {
      identityDocuments,
      residenceProofs,
      activityLocationProofs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Approve identity document (admin)
   */
  async approveIdentityDocument(documentId: string, adminId: string): Promise<any> {
    const document = await prisma.identityDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new AppError(t('error.document_not_found', 'fr'), 404);
    }

    return await prisma.identityDocument.update({
      where: { id: documentId },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: null
      }
    });
  }

  /**
   * Reject identity document (admin)
   */
  async rejectIdentityDocument(documentId: string, adminId: string, reason: string): Promise<any> {
    const document = await prisma.identityDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      throw new AppError(t('error.document_not_found', 'fr'), 404);
    }

    return await prisma.identityDocument.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason
      }
    });
  }

  /**
   * Approve residence proof (admin)
   */
  async approveResidenceProof(proofId: string, adminId: string): Promise<any> {
    const proof = await prisma.residenceProof.findUnique({
      where: { id: proofId }
    });

    if (!proof) {
      throw new AppError(t('error.residence_proof_not_found', 'fr'), 404);
    }

    return await prisma.residenceProof.update({
      where: { id: proofId },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: null
      }
    });
  }

  /**
   * Reject residence proof (admin)
   */
  async rejectResidenceProof(proofId: string, adminId: string, reason: string): Promise<any> {
    const proof = await prisma.residenceProof.findUnique({
      where: { id: proofId }
    });

    if (!proof) {
      throw new AppError(t('error.residence_proof_not_found', 'fr'), 404);
    }

    return await prisma.residenceProof.update({
      where: { id: proofId },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason
      }
    });
  }

  /**
   * Approve activity location proof (admin)
   */
  async approveActivityLocationProof(proofId: string, adminId: string): Promise<any> {
    const proof = await prisma.activityLocationProof.findUnique({
      where: { id: proofId }
    });

    if (!proof) {
      throw new AppError(t('error.activity_location_proof_not_found', 'fr'), 404);
    }

    return await prisma.activityLocationProof.update({
      where: { id: proofId },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: null
      }
    });
  }

  /**
   * Reject activity location proof (admin)
   */
  async rejectActivityLocationProof(proofId: string, adminId: string, reason: string): Promise<any> {
    const proof = await prisma.activityLocationProof.findUnique({
      where: { id: proofId }
    });

    if (!proof) {
      throw new AppError(t('error.activity_location_proof_not_found', 'fr'), 404);
    }

    return await prisma.activityLocationProof.update({
      where: { id: proofId },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason
      }
    });
  }

  /**
   * Verify user account (admin) - checks if all documents are approved
   */
  async verifyUserAccount(userId: string, adminId: string): Promise<any> {
    const status = await this.getUserDocumentsStatus(userId);

    if (!status.allDocumentsApproved) {
      throw new AppError(t('error.not_all_documents_approved', 'fr'), 400);
    }

    // Update user status
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'active',
        isActive: true,
        accountVerified: true,
        accountVerifiedAt: new Date(),
        accountVerifiedBy: adminId
      }
    });

    return user;
  }
}
