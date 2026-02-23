import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateFreeDaysRuleData {
  name: string;
  description?: string;
  numberOfDays: number;
  startType?: string;
  targetType?: string;
  targetDaysSinceRegistration?: number;
  targetMinSpend?: number;
  applyAfterSubscription?: boolean;
  validFrom?: Date;
  validUntil?: Date;
  maxBeneficiaries?: number;
}

export interface UpdateFreeDaysRuleData {
  name?: string;
  description?: string;
  numberOfDays?: number;
  startType?: string;
  targetType?: string;
  targetDaysSinceRegistration?: number;
  targetMinSpend?: number;
  applyAfterSubscription?: boolean;
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
        startType: data.startType || 'ON_USE',
        targetType: data.targetType || 'NEW_USERS',
        targetDaysSinceRegistration: data.targetDaysSinceRegistration,
        targetMinSpend: data.targetMinSpend,
        applyAfterSubscription: data.applyAfterSubscription || false,
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
   * Mettre à jour une règle
   */
  async updateRule(id: string, data: UpdateFreeDaysRuleData) {
    return await prisma.freeDaysRule.update({
      where: { id },
      data,
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

    // Vérifier si l'utilisateur a un abonnement actif
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: { gt: new Date() },
      },
    });

    let subscriptionPausedAt = null;
    if (activeSubscription && rule.applyAfterSubscription) {
      // Mettre en pause l'abonnement
      subscriptionPausedAt = new Date();
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: { isActive: false },
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + rule.numberOfDays);

    // Créer le bénéficiaire
    const beneficiary = await prisma.freeDaysBeneficiary.create({
      data: {
        ruleId,
        userId,
        daysGranted: rule.numberOfDays,
        daysRemaining: rule.numberOfDays,
        startDate: rule.startType === 'IMMEDIATE' ? new Date() : new Date(0), // Si startType est IMMEDIATE, commence maintenant
        expiresAt,
        subscriptionPausedAt,
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

    // Réactiver l'abonnement si nécessaire
    if (beneficiary.subscriptionPausedAt) {
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          isActive: false,
          endDate: { gt: new Date() },
        },
      });

      if (activeSubscription) {
        await prisma.subscription.update({
          where: { id: activeSubscription.id },
          data: { isActive: true },
        });
      }
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
   */
  async applyAutoRulesToNewUser(userId: string) {
    const rules = await prisma.freeDaysRule.findMany({
      where: {
        isActive: true,
        targetType: 'NEW_USERS',
      },
    });

    for (const rule of rules) {
      // Vérifier si le'utilisateur est déjà bénéficiaire
      const existingBeneficiary = await prisma.freeDaysBeneficiary.findFirst({
        where: {
          ruleId: rule.id,
          userId,
          isActive: true,
        },
      });

      if (existingBeneficiary) continue;

      // Vérifier le nombre maximum de bénéficiaires
      if (rule.maxBeneficiaries && rule.currentBeneficiaries >= rule.maxBeneficiaries) {
        continue;
      }

      // Vérifier si la règle est valide
      if (rule.validFrom && rule.validFrom > new Date()) continue;
      if (rule.validUntil && rule.validUntil < new Date()) continue;

      // Créer le bénéficiaire
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + rule.numberOfDays);

      await prisma.freeDaysBeneficiary.create({
        data: {
          ruleId: rule.id,
          userId,
          daysGranted: rule.numberOfDays,
          daysRemaining: rule.numberOfDays,
          startDate: rule.startType === 'IMMEDIATE' ? new Date() : new Date(0),
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

      // Trouver les utilisateurs qui correspondent
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - rule.targetDaysSinceRegistration);

      const users = await prisma.user.findMany({
        where: {
          createdAt: { lte: targetDate },
          role: 'USER',
        },
      });

      for (const user of users) {
        // Vérifier si déjà bénéficiaire
        const existingBeneficiary = await prisma.freeDaysBeneficiary.findFirst({
          where: {
            ruleId: rule.id,
            userId: user.id,
            isActive: true,
          },
        });

        if (existingBeneficiary) continue;

        // Vérifier le nombre maximum
        if (rule.maxBeneficiaries && rule.currentBeneficiaries >= rule.maxBeneficiaries) break;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + rule.numberOfDays);

        await prisma.freeDaysBeneficiary.create({
          data: {
            ruleId: rule.id,
            userId: user.id,
            daysGranted: rule.numberOfDays,
            daysRemaining: rule.numberOfDays,
            startDate: rule.startType === 'IMMEDIATE' ? new Date() : new Date(0),
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
   * Utiliser un jour gratuit
   */
  async useFreeDay(userId: string): Promise<boolean> {
    const beneficiary = await prisma.freeDaysBeneficiary.findFirst({
      where: {
        userId,
        isActive: true,
        daysRemaining: { gt: 0 },
        OR: [
          { startDate: { lte: new Date() } },
          { startDate: new Date(0) },
        ],
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
      // Réactiver l'abonnement si nécessaire
      if (updated.subscriptionPausedAt) {
        const activeSubscription = await prisma.subscription.findFirst({
          where: {
            userId,
            isActive: false,
            endDate: { gt: new Date() },
          },
        });

        if (activeSubscription) {
          await prisma.subscription.update({
            where: { id: activeSubscription.id },
            data: { isActive: true },
          });
        }
      }

      // Désactiver le bénéficiaire
      await prisma.freeDaysBeneficiary.update({
        where: { id: beneficiary.id },
        data: {
          isActive: false,
          subscriptionResumedAt: updated.subscriptionPausedAt ? new Date() : null,
        },
      });
    }

    return true;
  }

  /**
   * Obtenir les jours gratuits disponibles pour un utilisateur
   */
  async getUserFreeDays(userId: string) {
    return await prisma.freeDaysBeneficiary.findMany({
      where: {
        userId,
        isActive: true,
        daysRemaining: { gt: 0 },
        OR: [
          { startDate: { lte: new Date() } },
          { startDate: new Date(0) },
        ],
        expiresAt: { gt: new Date() },
      },
      include: {
        rule: {
          select: {
            name: true,
            startType: true,
          },
        },
      },
    });
  }
}

export default new FreeDaysRuleService();
