import express from 'express';
import { AuthRequest, logActivity } from '../middleware/auth';
import SubscriptionPackageService from '../services/SubscriptionPackageService';
import SubscriptionPackageRepository from '../repositories/SubscriptionPackageRepository';

class SubscriptionPackageAdminController {
  /**
   * Create a package
   */
  async createPackage(req: AuthRequest, res: express.Response) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Le nom du forfait est requis'
        });
      }

      const pkg = await SubscriptionPackageService.createPackage({
        name,
        description
      });

      await logActivity(
        req.user!.id,
        'CREATE',
        'SUBSCRIPTION_PACKAGE',
        pkg.id,
        `Created package ${name}`,
        { name, description },
        req
      );

      return res.status(201).json({
        success: true,
        message: 'Forfait créé avec succès',
        data: pkg
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get all packages
   */
  async getAllPackages(req: AuthRequest, res: express.Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const packages = await SubscriptionPackageRepository.getAllPackages(includeInactive);

      return res.json({
        success: true,
        data: packages
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get package by ID
   */
  async getPackageById(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const pkg = await SubscriptionPackageRepository.getPackageById(id);

      if (!pkg) {
        return res.status(404).json({
          success: false,
          message: 'Forfait non trouvé'
        });
      }

      return res.json({
        success: true,
        data: pkg
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update package
   */
  async updatePackage(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      const pkg = await SubscriptionPackageService.updatePackage(id, {
        name,
        description,
        isActive
      });

      await logActivity(
        req.user!.id,
        'UPDATE',
        'SUBSCRIPTION_PACKAGE',
        id,
        'Updated package',
        { name, description, isActive },
        req
      );

      return res.json({
        success: true,
        message: 'Forfait mis à jour avec succès',
        data: pkg
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Delete package
   */
  async deletePackage(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;

      await SubscriptionPackageService.deletePackage(id);

      await logActivity(
        req.user!.id,
        'DELETE',
        'SUBSCRIPTION_PACKAGE',
        id,
        'Deleted package',
        {},
        req
      );

      return res.json({
        success: true,
        message: 'Forfait supprimé avec succès'
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Create formula
   */
  async createFormula(req: AuthRequest, res: express.Response) {
    try {
      const { packageId, name, description, numberOfDays, price, dayStartHour, dayEndHour, chargeAfterHours, afterHoursPrice, afterHoursType } = req.body;

      if (!packageId || !name || numberOfDays === undefined || price === undefined) {
        return res.status(400).json({
          success: false,
          message: 'packageId, name, numberOfDays et price sont requis'
        });
      }

      const formula = await SubscriptionPackageService.createFormula({
        packageId,
        name,
        description,
        numberOfDays,
        price,
        dayStartHour: dayStartHour ?? 0,
        dayEndHour: dayEndHour ?? 23,
        chargeAfterHours: chargeAfterHours ?? false,
        afterHoursPrice,
        afterHoursType: afterHoursType ?? 'FIXED_PRICE'
      });

      await logActivity(
        req.user!.id,
        'CREATE',
        'SUBSCRIPTION_FORMULA',
        formula.id,
        `Created formula ${name}`,
        { packageId, name, numberOfDays, price },
        req
      );

      return res.status(201).json({
        success: true,
        message: 'Formule créée avec succès',
        data: formula
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get formulas by package
   */
  async getFormulasByPackage(req: AuthRequest, res: express.Response) {
    try {
      const { packageId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      const formulas = await SubscriptionPackageRepository.getFormulasByPackageId(packageId, includeInactive);

      return res.json({
        success: true,
        data: formulas
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update formula
   */
  async updateFormula(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const { name, description, numberOfDays, price, dayStartHour, dayEndHour, chargeAfterHours, afterHoursPrice, afterHoursType, isActive } = req.body;

      const formula = await SubscriptionPackageService.updateFormula(id, {
        name,
        description,
        numberOfDays,
        price,
        dayStartHour,
        dayEndHour,
        chargeAfterHours,
        afterHoursPrice,
        afterHoursType,
        isActive
      });

      await logActivity(
        req.user!.id,
        'UPDATE',
        'SUBSCRIPTION_FORMULA',
        id,
        'Updated formula',
        { name, numberOfDays, price },
        req
      );

      return res.json({
        success: true,
        message: 'Formule mise à jour avec succès',
        data: formula
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Delete formula
   */
  async deleteFormula(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;

      await SubscriptionPackageService.deleteFormula(id);

      await logActivity(
        req.user!.id,
        'DELETE',
        'SUBSCRIPTION_FORMULA',
        id,
        'Deleted formula',
        {},
        req
      );

      return res.json({
        success: true,
        message: 'Formule supprimée avec succès'
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Create promotion
   */
  async createPromotion(req: AuthRequest, res: express.Response) {
    try {
      const { name, description, discountType, discountValue, startDate, endDate, usageLimit, packageIds, formulaIds } = req.body;

      if (!name || !discountType || !discountValue || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'name, discountType, discountValue, startDate et endDate sont requis'
        });
      }

      const promotion = await SubscriptionPackageRepository.createPromotion({
        name,
        description,
        discountType,
        discountValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit
      });

      // Attach to packages and formulas
      if (packageIds && Array.isArray(packageIds)) {
        for (const packageId of packageIds) {
          await SubscriptionPackageRepository.attachPromotionToPackage(promotion.id, packageId);
        }
      }

      if (formulaIds && Array.isArray(formulaIds)) {
        for (const formulaId of formulaIds) {
          await SubscriptionPackageRepository.attachPromotionToFormula(promotion.id, formulaId);
        }
      }

      await logActivity(
        req.user!.id,
        'CREATE',
        'SUBSCRIPTION_PROMOTION',
        promotion.id,
        `Created promotion ${name}`,
        { name, discountValue },
        req
      );

      return res.status(201).json({
        success: true,
        message: 'Promotion créée avec succès',
        data: promotion
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get all promotions
   */
  async getAllPromotions(_req: AuthRequest, res: express.Response) {
    try {
      const promotions = await SubscriptionPackageRepository.getAllPromotions();

      return res.json({
        success: true,
        data: promotions
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update promotion
   */
  async updatePromotion(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const { name, description, discountType, discountValue, startDate, endDate, usageLimit, isActive } = req.body;

      const promotion = await SubscriptionPackageRepository.updatePromotion(id, {
        name,
        description,
        discountType,
        discountValue,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        usageLimit,
        isActive
      });

      await logActivity(
        req.user!.id,
        'UPDATE',
        'SUBSCRIPTION_PROMOTION',
        id,
        'Updated promotion',
        { name, discountValue },
        req
      );

      return res.json({
        success: true,
        message: 'Promotion mise à jour avec succès',
        data: promotion
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Delete promotion
   */
  async deletePromotion(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;

      await SubscriptionPackageRepository.deletePromotion(id);

      await logActivity(
        req.user!.id,
        'DELETE',
        'SUBSCRIPTION_PROMOTION',
        id,
        'Deleted promotion',
        {},
        req
      );

      return res.json({
        success: true,
        message: 'Promotion supprimée avec succès'
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new SubscriptionPackageAdminController();
