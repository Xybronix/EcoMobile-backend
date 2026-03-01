import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Date sentinelle = forfait non encore activé par l'utilisateur
const NOT_YET_ACTIVATED = new Date('2099-01-01T00:00:00.000Z');

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
   * Mettre à jour une règle (on ne touche pas startType)
   */
  async updateRule(id: string, data: UpdateFreeDaysRuleData) {
    return await prisma.freeDaysRule.update({
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

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + rule.numberOfDays);

    // Créer le bénéficiaire — en attente d'activation par l'utilisateur
    const beneficiary = await prisma.freeDaysBeneficiary.create({
      data: {
        ruleId,
        userId,
        daysGranted: rule.numberOfDays,
        daysRemaining: rule.numberOfDays,
        startDate: NOT_YET_ACTIVATED,
        expiresAt,
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

    return await prisma.freeDaysBeneficiary.update({
      where: { id: beneficiaryId },
      data: { startDate: new Date() },
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

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + rule.numberOfDays);

      await prisma.freeDaysBeneficiary.create({
        data: {
          ruleId: rule.id,
          userId,
          daysGranted: rule.numberOfDays,
          daysRemaining: rule.numberOfDays,
          startDate: NOT_YET_ACTIVATED,
          expiresAt,
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

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + rule.numberOfDays);

        await prisma.freeDaysBeneficiary.create({
          data: {
            ruleId: rule.id,
            userId: user.id,
            daysGranted: rule.numberOfDays,
            daysRemaining: rule.numberOfDays,
            startDate: NOT_YET_ACTIVATED,
            expiresAt,
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
   * Utiliser un jour gratuit (uniquement sur les forfaits activés par l'utilisateur)
   */
  async useFreeDay(userId: string): Promise<boolean> {
    const beneficiary = await prisma.freeDaysBeneficiary.findFirst({
      where: {
        userId,
        isActive: true,
        daysRemaining: { gt: 0 },
        startDate: { lte: new Date() }, // Seulement les forfaits activés par l'utilisateur
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
    });

    if (!beneficiary) {
      return false;
    }

    await prisma.freeDaysBeneficiary.update({
      where: { id: beneficiary.id },
      data: {
        daysRemaining: { decrement: 1 },
      },
    });

    // Vérifier si tous les jours sont utilisés
    const updated = await prisma.freeDaysBeneficiary.findUnique({
      where: { id: beneficiary.id },
    });

    if (updated && updated.daysRemaining <= 0) {
      await prisma.freeDaysBeneficiary.update({
        where: { id: beneficiary.id },
        data: {
          isActive: false,
          subscriptionResumedAt: null,
        },
      });
    }

    return true;
  }

  /**
   * Obtenir tous les forfaits gratuits d'un utilisateur (activés ET en attente d'activation)
   */
  async getUserFreeDays(userId: string) {
    const now = new Date();
    return await prisma.freeDaysBeneficiary.findMany({
      where: {
        userId,
        isActive: true,
        daysRemaining: { gt: 0 },
        expiresAt: { gt: now },
      },
      include: {
        rule: {
          select: {
            name: true,
            startHour: true,
            endHour: true,
          },
        },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }
}

export default new FreeDaysRuleService();
