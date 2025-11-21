import { prisma } from '../config/prisma';
import NotificationService from './NotificationService';

export class DepositService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Recharger la caution
   */
  async rechargeDeposit(userId: string, amount: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      throw new Error('Utilisateur non trouvé');
    }

    if (user.wallet.balance < amount) {
      throw new Error('Solde wallet insuffisant');
    }

    await prisma.$transaction(async (tx) => {
      // Déduire du wallet
      await tx.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: { decrement: amount } }
      });

      // Ajouter à la caution
      await tx.user.update({
        where: { id: userId },
        data: { depositBalance: { increment: amount } }
      });

      // Créer transaction
      await tx.transaction.create({
        data: {
          walletId: user.wallet.id,
          type: 'WITHDRAWAL',
          amount,
          fees: 0,
          totalAmount: amount,
          status: 'COMPLETED',
          paymentMethod: 'WALLET',
          metadata: { type: 'deposit_recharge' }
        }
      });
    });
  }

  /**
   * Prélever pour dégâts
   */
  async deductForDamage(userId: string, amount: number, reason: string, imageUrl?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (user.depositBalance < amount) {
      throw new Error('Caution insuffisante pour couvrir les dégâts');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { depositBalance: { decrement: amount } }
    });

    // Notification avec image si fournie
    await this.notificationService.createNotification({
      userId,
      title: 'Prélèvement pour dégâts',
      message: `Un montant de ${amount} FCFA a été prélevé sur votre caution. Raison: ${reason}`,
      type: 'DAMAGE_DEDUCTION'
    });
  }

  /**
   * Obtenir la caution requise
   */
  async getRequiredDeposit(): Promise<number> {
    const setting = await prisma.settings.findUnique({
      where: { key: 'required_deposit' }
    });
    return setting ? parseFloat(setting.value) : 20000;
  }

  /**
   * Mettre à jour la caution requise (admin)
   */
  async updateRequiredDeposit(amount: number): Promise<void> {
    await prisma.settings.upsert({
      where: { key: 'required_deposit' },
      update: { value: amount.toString() },
      create: { key: 'required_deposit', value: amount.toString() }
    });
  }
}

export default new DepositService();