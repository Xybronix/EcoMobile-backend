import express from 'express';
import { AuthRequest, logActivity } from '../middleware/auth';
import FreeDaysRuleService from '../services/FreeDaysRuleService';
import prisma from '../config/prisma';

class FreeDaysRuleController {
  
  /**
   * @swagger
   * /free-days:
   *   post:
   *     summary: Créer une nouvelle règle de jours gratuits
   *     tags: [FreeDaysRules]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - numberOfDays
   *             properties:
   *               name:
   *                 type: string
   *                 description: Nom de la règle
   *               description:
   *                 type: string
   *                 description: Description de la règle
   *               numberOfDays:
   *                 type: integer
   *                 description: Nombre de jours gratuits accordés
   *               startType:
   *                 type: string
   *                 enum: [IMMEDIATE, ON_USE]
   *                 description: "IMMEDIATE = commence tout de suite, ON_USE = commence à l'utilisation"
   *               targetType:
   *                 type: string
   *                 enum: [NEW_USERS, EXISTING_BY_DAYS, EXISTING_BY_SPEND, MANUAL]
   *                 description: Type de cible pour la règle
   *               targetDaysSinceRegistration:
   *                 type: integer
   *                 description: Nombre de jours depuis l'inscription (pour EXISTING_BY_DAYS)
   *               targetMinSpend:
   *                 type: number
   *                 description: Montant minimum dépensé (pour EXISTING_BY_SPEND)
   *               applyAfterSubscription:
   *                 type: boolean
   *                 description: Appliquer après l'abonnement en cours ou mettre en pause
   *               validFrom:
   *                 type: string
   *                 format: date-time
   *                 description: Date de début de validité
   *               validUntil:
   *                 type: string
   *                 format: date-time
   *                 description: Date de fin de validité
   *               maxBeneficiaries:
   *                 type: integer
   *                 description: Nombre maximum de bénéficiaires (null = illimité)
   *     responses:
   *       201:
   *         description: Règle créée avec succès
   */
  async createRule(req: AuthRequest, res: express.Response) {
    try {
      const {
        name,
        description,
        numberOfDays,
        startType,
        targetType,
        targetDaysSinceRegistration,
        targetMinSpend,
        applyAfterSubscription,
        validFrom,
        validUntil,
        maxBeneficiaries,
      } = req.body;

      if (!name || !numberOfDays) {
        return res.status(400).json({
          success: false,
          message: 'Le nom et le nombre de jours sont requis',
        });
      }

      const rule = await FreeDaysRuleService.createRule({
        name,
        description,
        numberOfDays,
        startType,
        targetType,
        targetDaysSinceRegistration,
        targetMinSpend,
        applyAfterSubscription,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        maxBeneficiaries,
      });

      await logActivity(
        req.user!.id,
        'CREATE',
        'FREE_DAYS_RULE',
        rule.id,
        `Created free days rule: ${name}`,
        { name, numberOfDays, targetType },
        req
      );

      return res.status(201).json({
        success: true,
        message: 'Règle de jours gratuits créée avec succès',
        data: rule,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  
  /**
   * @swagger
   * /free-days:
   *   get:
   *     summary: Récupérer toutes les règles de jours gratuits
   *     tags: [FreeDaysRules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: includeInactive
   *         schema:
   *           type: boolean
   *         description: Inclure les règles inactives
   *     responses:
   *       200:
   *         description: Liste des règles
   */
  async getAllRules(req: AuthRequest, res: express.Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const rules = await FreeDaysRuleService.getAllRules(includeInactive);

      return res.json({
        success: true,
        data: rules,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @swagger
   * /free-days/{id}:
   *   get:
   *     summary: Récupérer une règle par ID
   *     tags: [FreeDaysRules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la règle
   *     responses:
   *       200:
   *         description: Détails de la règle avec ses bénéficiaires
   */
  async getRuleById(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const rule = await FreeDaysRuleService.getRuleById(id);

      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Règle non trouvée',
        });
      }

      return res.json({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  
  /**
   * @swagger
   * /free-days/{id}:
   *   put:
   *     summary: Mettre à jour une règle
   *     tags: [FreeDaysRules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la règle
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               numberOfDays:
   *                 type: integer
   *               startType:
   *                 type: string
   *                 enum: [IMMEDIATE, ON_USE]
   *               targetType:
   *                 type: string
   *                 enum: [NEW_USERS, EXISTING_BY_DAYS, EXISTING_BY_SPEND, MANUAL]
   *               targetDaysSinceRegistration:
   *                 type: integer
   *               targetMinSpend:
   *                 type: number
   *               applyAfterSubscription:
   *                 type: boolean
   *               isActive:
   *                 type: boolean
   *               validFrom:
   *                 type: string
   *                 format: date-time
   *               validUntil:
   *                 type: string
   *                 format: date-time
   *               maxBeneficiaries:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Règle mise à jour avec succès
   *       400:
   *         description: Données invalides
   *       401:
   *         description: Non authentifié
   *       403:
   *         description: Non autorisé
   */
  async updateRule(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        numberOfDays,
        startType,
        targetType,
        targetDaysSinceRegistration,
        targetMinSpend,
        applyAfterSubscription,
        isActive,
        validFrom,
        validUntil,
        maxBeneficiaries,
      } = req.body;

      const rule = await FreeDaysRuleService.updateRule(id, {
        name,
        description,
        numberOfDays,
        startType,
        targetType,
        targetDaysSinceRegistration,
        targetMinSpend,
        applyAfterSubscription,
        isActive,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        maxBeneficiaries,
      });

      await logActivity(
        req.user!.id,
        'UPDATE',
        'FREE_DAYS_RULE',
        id,
        'Updated free days rule',
        { name, numberOfDays },
        req
      );

      return res.json({
        success: true,
        message: 'Règle mise à jour avec succès',
        data: rule,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @swagger
   * /free-days/{id}:
   *   delete:
   *     summary: Supprimer une règle
   *     tags: [FreeDaysRules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la règle
   *     responses:
   *       200:
   *         description: Règle supprimée avec succès
   *       400:
   *         description: Erreur lors de la suppression
   *       401:
   *         description: Non authentifié
   *       403:
   *         description: Non autorisé
   */
  async deleteRule(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;

      await FreeDaysRuleService.deleteRule(id);

      await logActivity(
        req.user!.id,
        'DELETE',
        'FREE_DAYS_RULE',
        id,
        'Deleted free days rule',
        {},
        req
      );

      return res.json({
        success: true,
        message: 'Règle supprimée avec succès',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @swagger
   * /free-days/{id}/beneficiaries:
   *   post:
   *     summary: Ajouter un bénéficiaire manuel à une règle
   *     tags: [FreeDaysRules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la règle
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *                 description: ID de l'utilisateur à ajouter
   *     responses:
   *       201:
   *         description: Bénéficiaire ajouté avec succès
   *       400:
   *         description: Erreur (utilisateur déjà bénéficiaire, limite atteinte, etc.)
   *       401:
   *         description: Non authentifié
   *       403:
   *         description: Non autorisé
   */
  async addBeneficiary(req: AuthRequest, res: express.Response) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "L'ID de l'utilisateur est requis",
        });
      }

      const beneficiary = await FreeDaysRuleService.addManualBeneficiary(id, userId);

      await logActivity(
        req.user!.id,
        'CREATE',
        'FREE_DAYS_BENEFICIARY',
        beneficiary.id,
        'Added manual beneficiary to free days rule',
        { ruleId: id, userId },
        req
      );

      return res.status(201).json({
        success: true,
        message: 'Bénéficiaire ajouté avec succès',
        data: beneficiary,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * @swagger
   * /free-days/{id}/beneficiaries/{userId}:
   *   delete:
   *     summary: Supprimer un bénéficiaire d'une règle
   *     tags: [FreeDaysRules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de la règle
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID de l'utilisateur à supprimer
   *     responses:
   *       200:
   *         description: Bénéficiaire supprimé avec succès
   *       400:
   *         description: Bénéficiaire non trouvé
   *       401:
   *         description: Non authentifié
   *       403:
   *         description: Non autorisé
   */
  async removeBeneficiary(req: AuthRequest, res: express.Response) {
    try {
      const { id, userId } = req.params;

      await FreeDaysRuleService.removeBeneficiary(id, userId);

      await logActivity(
        req.user!.id,
        'DELETE',
        'FREE_DAYS_BENEFICIARY',
        `${id}_${userId}`,
        'Removed beneficiary from free days rule',
        { ruleId: id, userId },
        req
      );

      return res.json({
        success: true,
        message: 'Bénéficiaire supprimé avec succès',
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  
  /**
   * @swagger
   * /free-days/users/search:
   *   get:
   *     summary: Rechercher des utilisateurs pour l'ajout manuel
   *     tags: [FreeDaysRules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Terme de recherche (nom, email, téléphone)
   *     responses:
   *       200:
   *         description: Liste des utilisateurs correspondants
   */
  async searchUsers(req: AuthRequest, res: express.Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Le terme de recherche est requis',
        });
      }

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
          role: 'USER',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
        take: 20,
      });

      return res.json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new FreeDaysRuleController();
