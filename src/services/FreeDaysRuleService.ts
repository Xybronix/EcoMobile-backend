import { prisma } from '../config/prisma';

// Date sentinelle = forfait non encore activé par l'utilisateur
const NOT_YET_ACTIVATED = new Date('2099-01-01T00:00:00.000Z');
// Placeholder expiresAt tant que le forfait n'est pas activé (sera recalculé à l'activation)
const EXPIRES_PLACEHOLDER = new Date('2099-12-31T23:59:59.999Z');

export interface CreateFreeDaysRuleData {
  name: string;
  description?: string;
  numberOfDays: number;
  targetType?: string;
  targetDaysSinceRegistration?: number;
  targetMinSpend?: number;
  startHour?: number;
  endHour?: number;
  validFrom?: Date;
  validUntil?: Date;
  maxBeneficiaries?: number;
}

export interface UpdateFreeDaysRuleData {
  name?: string;
  description?: string;
  numberOfDays?: number;
  targetType?: string;
  targetDaysSinceRegistration?: number;
  targetMinSpend?: number;
  startHour?: number;
  endHour?: number;
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
  maxBeneficiaries?: number;
}

class FreeDaysRuleService {
  /**
   * Créer une nouvelle règle de jours gratuits
   */
  async createRule(data: CreateFreeDaysRuleData) {
    return await prisma.freeDaysRule.create({
      data: {
        name: data.name,
        description: data.description,
        numberOfDays: data.numberOfDays,
        targetType: data.targetType || 'NEW_USERS',
        targetDaysSinceRegistration: data.targetDaysSinceRegistration,
        targetMinSpend: data.targetMinSpend,
        startHour: data.startHour,
        endHour: data.endHour,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        maxBeneficiaries: data.maxBeneficiaries,
      },
    });
  }

  /**
   * Récupérer toutes les règles
   */
  async getAllRules(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { isActive: true };
    return await prisma.freeDaysRule.findMany({
      where,
      include: {
        _count: {
          select: { beneficiaries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer une règle par ID
   */
  async getRuleById(id: string) {
    return await prisma.freeDaysRule.findUnique({
      where: { id },
      include: {
        beneficiaries: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Mettre à jour une règle et propager le changement de numberOfDays aux bénéficiaires
   */
  async updateRule(id: string, data: UpdateFreeDaysRuleData) {
    const rule = await prisma.freeDaysRule.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        numberOfDays: data.numberOfDays,
        targetType: data.targetType,
        targetDaysSinceRegistration: data.targetDaysSinceRegistration,
        targetMinSpend: data.targetMinSpend,
        startHour: data.startHour,
        endHour: data.endHour,
        isActive: data.isActive,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        maxBeneficiaries: data.maxBeneficiaries,
      },
    });

    // Propager le changement de numberOfDays aux bénéficiaires existants
    if (data.numberOfDays !== undefined) {
      const beneficiaries = await prisma.freeDaysBeneficiary.findMany({
        where: { ruleId: id },
      });

      for (const b of beneficiaries) {
        const daysUsed = b.daysGranted - b.daysRemaining;

        if (daysUsed >= data.numberOfDays) {
          // L'utilisateur a déjà consommé autant ou plus que le nouveau plafond
          // On ne facture pas rétroactivement — on marque juste le forfait comme épuisé
          await prisma.freeDaysBeneficiary.update({
            where: { id: b.id },
            data: { daysGranted: data.numberOfDays, daysRemaining: 0, isActive: false },
          });
        } else {
          const newRemaining = data.numberOfDays - daysUsed;
          await prisma.freeDaysBeneficiary.update({
            where: { id: b.id },
            data: {
              daysGranted: data.numberOfDays,
              daysRemaining: newRemaining,
              // Réactiver si le forfait était épuisé et que le nouveau nombre est plus grand
              isActive: newRemaining > 0,
            },
          });
        }
      }
    }

    return rule;
  }

  /**
   * Supprimer une règle
   */
  async deleteRule(id: string) {
    return await prisma.freeDaysRule.delete({
      where: { id },
    });
  }

  /**
   * Ajouter un bénéficiaire manuel à une règle
   * Le forfait créé est en attente d'activation par l'utilisateur (startDate dans le futur)
   */
  async addManualBeneficiary(ruleId: string, userId: string) {
    const rule = await prisma.freeDaysRule.findUnique({ where: { id: ruleId } });
    if (!rule) {
      throw new Error('Règle non trouvée');
    }

    // Vérifier si le bénéficiaire existe déjà
    const existingBeneficiary = await prisma.freeDaysBeneficiary.findUnique({
      where: {
        ruleId_userId: { ruleId, userId },
      },
    });

    if (existingBeneficiary) {
      throw new Error('Cet utilisateur bénéficie déjà de cette règle');
    }

    // Vérifier le nombre maximum de bénéficiaires
    if (rule.maxBeneficiaries && rule.currentBeneficiaries >= rule.maxBeneficiaries) {
      throw new Error('Le nombre maximum de bénéficiaires a été atteint');
    }

    // expiresAt sera recalculé à l'activation par l'utilisateur
    // Créer le bénéficiaire — en attente d'activation par l'utilisateur
    const beneficiary = await prisma.freeDaysBeneficiary.create({
      data: {
        ruleId,
        userId,
        daysGranted: rule.numberOfDays,
        daysRemaining: rule.numberOfDays,
        startDate: NOT_YET_ACTIVATED,
        expiresAt: EXPIRES_PLACEHOLDER,
        subscriptionPausedAt: null,
      },
    });

    // Mettre à jour le compteur de bénéficiaires
    await prisma.freeDaysRule.update({
      where: { id: ruleId },
      data: { currentBeneficiaries: { increment: 1 } },
    });

    return beneficiary;
  }

  /**
   * Activer un forfait gratuit — l'utilisateur décide de l'utiliser
   */
  async activateBeneficiary(beneficiaryId: string, userId: string) {
    const beneficiary = await prisma.freeDaysBeneficiary.findFirst({
      where: { id: beneficiaryId, userId, isActive: true },
    });

    if (!beneficiary) {
      throw new Error('Forfait gratuit introuvable');
    }

    if (beneficiary.startDate <= new Date()) {
      throw new Error('Ce forfait est déjà activé');
    }

    // Recalculer expiresAt depuis la date d'activation (pas de création)
    const activationDate = new Date();
    const expiresAt = new Date(activationDate);
    expiresAt.setDate(expiresAt.getDate() + beneficiary.daysGranted);

    return await prisma.freeDaysBeneficiary.update({
      where: { id: beneficiaryId },
      data: { startDate: activationDate, expiresAt },
    });
  }

  /**
   * Supprimer un bénéficiaire manuel d'une règle
   */
  async removeBeneficiary(ruleId: string, userId: string) {
    const beneficiary = await prisma.freeDaysBeneficiary.findUnique({
      where: {
        ruleId_userId: { ruleId, userId },
      },
    });

    if (!beneficiary) {
      throw new Error('Bénéficiaire non trouvé');
    }

    await prisma.freeDaysBeneficiary.delete({
      where: { id: beneficiary.id },
    });

    // Mettre à jour le compteur de bénéficiaires
    await prisma.freeDaysRule.update({
      where: { id: ruleId },
      data: { currentBeneficiaries: { decrement: 1 } },
    });

    return true;
  }

  /**
   * Appliquer automatiquement les règles aux nouveaux utilisateurs
   * Le forfait est créé en attente — l'utilisateur devra l'activer
   */
  async applyAutoRulesToNewUser(userId: string) {
    const rules = await prisma.freeDaysRule.findMany({
      where: {
        isActive: true,
        targetType: 'NEW_USERS',
      },
    });

    for (const rule of rules) {
      const existingBeneficiary = await prisma.freeDaysBeneficiary.findFirst({
        where: { ruleId: rule.id, userId, isActive: true },
      });

      if (existingBeneficiary) continue;

      if (rule.maxBeneficiaries && rule.currentBeneficiaries >= rule.maxBeneficiaries) {
        continue;
      }

      if (rule.validFrom && rule.validFrom > new Date()) continue;
      if (rule.validUntil && rule.validUntil < new Date()) continue;

      await prisma.freeDaysBeneficiary.create({
        data: {
          ruleId: rule.id,
          userId,
          daysGranted: rule.numberOfDays,
          daysRemaining: rule.numberOfDays,
          startDate: NOT_YET_ACTIVATED,
          expiresAt: EXPIRES_PLACEHOLDER,
        },
      });

      await prisma.freeDaysRule.update({
        where: { id: rule.id },
        data: { currentBeneficiaries: { increment: 1 } },
      });
    }
  }

  /**
   * Appliquer automatiquement les règles par temps depuis inscription
   */
  async applyRulesByRegistrationDays() {
    const rules = await prisma.freeDaysRule.findMany({
      where: {
        isActive: true,
        targetType: 'EXISTING_BY_DAYS',
      },
    });

    for (const rule of rules) {
      if (!rule.targetDaysSinceRegistration) continue;

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - rule.targetDaysSinceRegistration);

      const users = await prisma.user.findMany({
        where: {
          createdAt: { lte: targetDate },
          role: 'USER',
        },
      });

      for (const user of users) {
        const existingBeneficiary = await prisma.freeDaysBeneficiary.findFirst({
          where: { ruleId: rule.id, userId: user.id, isActive: true },
        });

        if (existingBeneficiary) continue;

        if (rule.maxBeneficiaries && rule.currentBeneficiaries >= rule.maxBeneficiaries) break;

        await prisma.freeDaysBeneficiary.create({
          data: {
            ruleId: rule.id,
            userId: user.id,
            daysGranted: rule.numberOfDays,
            daysRemaining: rule.numberOfDays,
            startDate: NOT_YET_ACTIVATED,
            expiresAt: EXPIRES_PLACEHOLDER,
          },
        });

        await prisma.freeDaysRule.update({
          where: { id: rule.id },
          data: { currentBeneficiaries: { increment: 1 } },
        });
      }
    }
  }

  /**
   * Appliquer un jour gratuit pour un trajet terminé.
   * - Vérifie si le trajet a commencé dans la plage horaire de la règle (lue dynamiquement).
   * - Calcule l'éventuel overtime : heures après la fin de la plage → facturées au taux horaire.
   * - Décrémente daysRemaining et désactive le bénéficiaire si épuisé.
   *
   * @param userId
   * @param rideStartTime  heure de début du trajet (datetime complet)
   * @param rideEndTime    heure de fin du trajet (datetime complet)
   * @param hourlyRate     tarif horaire (XAF/h) pour calculer l'overtime
   */
  async applyFreeDay(
    userId: string,
    rideStartTime: Date,
    rideEndTime: Date,
    hourlyRate: number,
  ): Promise<{ applied: boolean; overtimeCost: number; ruleName: string }> {
    const beneficiaries = await prisma.freeDaysBeneficiary.findMany({
      where: {
        userId,
        isActive: true,
        daysRemaining: { gt: 0 },
        startDate: { lte: rideEndTime },     // forfait activé avant la fin du trajet
        expiresAt: { gt: rideStartTime },    // pas encore expiré au début du trajet
      },
      include: {
        rule: { select: { name: true, startHour: true, endHour: true } },
      },
      orderBy: { expiresAt: 'asc' },
    });

    // Chercher un bénéficiaire dont la plage couvre l'heure de début du trajet
    // La plage est lue dynamiquement → un changement admin s'applique immédiatement
    const rideStartHour = rideStartTime.getHours();
    const beneficiary = beneficiaries.find((b) => {
      const { startHour, endHour } = b.rule;
      if (startHour == null || endHour == null) return true; // pas de restriction horaire
      return rideStartHour >= startHour && rideStartHour < endHour;
    }) ?? null;

    if (!beneficiary) {
      return { applied: false, overtimeCost: 0, ruleName: '' };
    }

    // Calculer l'overtime : temps après la fin de la plage gratuite
    const { endHour } = beneficiary.rule;
    let overtimeCost = 0;
    if (endHour != null) {
      // Construire la datetime "fin de plage" le même jour que le trajet
      const endOfFreeWindow = new Date(rideStartTime);
      endOfFreeWindow.setHours(endHour, 0, 0, 0);
      // Si la borne de fin est déjà dépassée au moment du départ (ne devrait pas arriver
      // car on a vérifié rideStartHour < endHour, mais garde-fou par sécurité)
      if (endOfFreeWindow <= rideStartTime) {
        endOfFreeWindow.setDate(endOfFreeWindow.getDate() + 1);
      }
      if (rideEndTime > endOfFreeWindow) {
        const overtimeMs = rideEndTime.getTime() - endOfFreeWindow.getTime();
        const overtimeHours = overtimeMs / (1000 * 60 * 60);
        overtimeCost = Math.ceil(overtimeHours) * hourlyRate;
      }
    }

    // Décrémenter le compteur de jours
    await prisma.freeDaysBeneficiary.update({
      where: { id: beneficiary.id },
      data: { daysRemaining: { decrement: 1 } },
    });

    // Désactiver si épuisé
    const updated = await prisma.freeDaysBeneficiary.findUnique({
      where: { id: beneficiary.id },
    });
    if (updated && updated.daysRemaining <= 0) {
      await prisma.freeDaysBeneficiary.update({
        where: { id: beneficiary.id },
        data: { isActive: false, subscriptionResumedAt: null },
      });
    }

    return { applied: true, overtimeCost, ruleName: beneficiary.rule.name };
  }

  /**
   * Obtenir tous les forfaits gratuits d'un utilisateur (activés ET en attente d'activation)
   */
  async getUserFreeDays(userId: string) {
    return await prisma.freeDaysBeneficiary.findMany({
      where: {
        userId,
        isActive: true,
        daysRemaining: { gt: 0 },
      },
      include: {
        rule: {
          select: {
            name: true,
            startHour: true,
            endHour: true,
            validFrom: true,
            validUntil: true,
          },
        },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }
}

export default new FreeDaysRuleService();
