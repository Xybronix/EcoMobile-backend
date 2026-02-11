import { Response } from 'express';

interface SSEClient {
  userId: string;
  response: Response;
  lastEventId: number;
}

/**
 * Service pour gérer les connexions SSE (Server-Sent Events) pour les notifications en temps réel
 * Évite le polling et réduit drastiquement le nombre de requêtes
 */
export class NotificationSSEService {
  private static instance: NotificationSSEService | undefined;
  private clients: Map<string, SSEClient> = new Map();
  private _notificationService: InstanceType<typeof import('./NotificationService').default> | null = null;

  /** Lazy pour éviter la dépendance circulaire avec NotificationService */
  private get notificationService(): InstanceType<typeof import('./NotificationService').default> {
    if (!this._notificationService) {
      const NotificationServiceClass = require('./NotificationService').default;
      this._notificationService = new NotificationServiceClass();
    }
    return this._notificationService!;
  }

  private constructor() {}

  public static getInstance(): NotificationSSEService {
    if (!NotificationSSEService.instance) {
      NotificationSSEService.instance = new NotificationSSEService();
    }
    return NotificationSSEService.instance as NotificationSSEService;
  }

  /**
   * Ajoute un client SSE
   */
  public addClient(userId: string, res: Response): void {
    // Configurer les en-têtes SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Désactiver la mise en cache nginx

    // Envoyer un commentaire initial pour maintenir la connexion
    res.write(': SSE connection established\n\n');

    // Stocker le client
    const clientId = `${userId}-${Date.now()}`;
    this.clients.set(clientId, {
      userId,
      response: res,
      lastEventId: 0,
    });

    // Envoyer le nombre de notifications non lues immédiatement
    this.sendUnreadCount(userId);

    // Gérer la déconnexion
    res.on('close', () => {
      this.removeClient(clientId);
    });

    // Gérer les erreurs
    res.on('error', (error) => {
      console.error(`[SSE] Error for client ${clientId}:`, error);
      this.removeClient(clientId);
    });

    // Envoyer un heartbeat toutes les 30 secondes pour maintenir la connexion
    const heartbeatInterval = setInterval(() => {
      if (this.clients.has(clientId)) {
        try {
          res.write(': heartbeat\n\n');
        } catch (error) {
          clearInterval(heartbeatInterval);
          this.removeClient(clientId);
        }
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Nettoyer l'intervalle lors de la déconnexion
    res.on('close', () => {
      clearInterval(heartbeatInterval);
    });
  }

  /**
   * Envoie une notification à un utilisateur spécifique
   */
  public async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    const clientsToNotify = Array.from(this.clients.values()).filter(
      (client) => client.userId === userId
    );

    if (clientsToNotify.length === 0) {
      return; // Aucun client connecté pour cet utilisateur
    }

    const eventData = JSON.stringify({
      type: 'notification',
      data: notification,
    });

    clientsToNotify.forEach((client) => {
      try {
        client.response.write(`id: ${Date.now()}\n`);
        client.response.write(`event: notification\n`);
        client.response.write(`data: ${eventData}\n\n`);
        client.lastEventId = Date.now();
      } catch (error) {
        console.error(`[SSE] Error sending notification to client:`, error);
        // Le client sera supprimé lors du prochain heartbeat ou lors de la prochaine tentative d'envoi
      }
    });
  }

  /**
   * Envoie le nombre de notifications non lues à un utilisateur
   */
  public async sendUnreadCount(userId: string): Promise<void> {
    try {
      const unreadCount = await this.notificationService.getUnreadCount(userId);

      const clientsToNotify = Array.from(this.clients.values()).filter(
        (client) => client.userId === userId
      );

      if (clientsToNotify.length === 0) {
        return;
      }

      const eventData = JSON.stringify({
        type: 'unread_count',
        count: unreadCount,
      });

      clientsToNotify.forEach((client) => {
        try {
          client.response.write(`id: ${Date.now()}\n`);
          client.response.write(`event: unread_count\n`);
          client.response.write(`data: ${eventData}\n\n`);
        } catch (error) {
          console.error(`[SSE] Error sending unread count to client:`, error);
        }
      });
    } catch (error) {
      console.error(`[SSE] Error getting unread count for user ${userId}:`, error);
    }
  }

  /**
   * Met à jour le nombre de notifications non lues pour tous les clients d'un utilisateur
   */
  public async updateUnreadCountForUser(userId: string): Promise<void> {
    await this.sendUnreadCount(userId);
  }

  /**
   * Supprime un client
   */
  private removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  /**
   * Obtient le nombre de clients connectés
   */
  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Obtient le nombre de clients connectés pour un utilisateur spécifique
   */
  public getConnectedClientsCountForUser(userId: string): number {
    return Array.from(this.clients.values()).filter(
      (client) => client.userId === userId
    ).length;
  }

  /**
   * Nettoie les clients déconnectés (à appeler périodiquement)
   */
  public cleanupDisconnectedClients(): void {
    const clientsToRemove: string[] = [];

    this.clients.forEach((client, clientId) => {
      // Vérifier si la réponse est toujours valide
      if (client.response.destroyed || client.response.closed) {
        clientsToRemove.push(clientId);
      }
    });

    clientsToRemove.forEach((clientId) => {
      this.removeClient(clientId);
    });
  }
}

export const notificationSSEService = NotificationSSEService.getInstance();
