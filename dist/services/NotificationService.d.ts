import { Notification } from '../repositories/NotificationRepository';
export interface NotificationWithEmail {
    userId: string;
    title: string;
    message: string;
    type: string;
    sendEmail?: boolean;
    emailData?: {
        userEmail: string;
        firstName: string;
        lang: 'en' | 'fr';
    };
}
declare class NotificationService {
    private emailService;
    constructor();
    /**
     * Create a notification (and optionally send email)
     */
    createNotification(data: NotificationWithEmail): Promise<Notification>;
    /**
     * Bulk delete notifications
     */
    bulkDeleteNotifications(notificationIds: string[]): Promise<void>;
    /**
     * Create notification for ride started
     */
    notifyRideStarted(userId: string, bikeCode: string, _userEmail?: string, _firstName?: string, lang?: 'en' | 'fr'): Promise<Notification>;
    /**
     * Create notification for ride ended
     */
    notifyRideEnded(userId: string, rideDetails: {
        duration: number;
        distance: number;
        cost: number;
    }, userEmail: string, firstName: string, lang?: 'en' | 'fr'): Promise<Notification>;
    /**
     * Create notification for wallet deposit
     */
    notifyWalletDeposit(userId: string, amount: number, balance: number, userEmail: string, firstName: string, lang?: 'en' | 'fr'): Promise<Notification>;
    /**
     * Create notification for wallet withdrawal
     */
    notifyWalletWithdrawal(userId: string, amount: number, _userEmail?: string, _firstName?: string, lang?: 'en' | 'fr'): Promise<Notification>;
    /**
     * Create notification for ride payment
     */
    notifyRidePayment(userId: string, amount: number, _userEmail?: string, _firstName?: string, lang?: 'en' | 'fr'): Promise<Notification>;
    /**
     * Send welcome notification and email
     */
    sendWelcomeNotification(userId: string, userEmail: string, firstName: string, lang?: 'en' | 'fr'): Promise<Notification>;
    /**
     * Send password reset notification and email
     */
    sendPasswordResetNotification(userId: string, userEmail: string, firstName: string, resetToken: string, lang?: 'en' | 'fr'): Promise<void>;
    /**
     * Send incident reported notification
     */
    notifyIncidentReported(userId: string, _incidentId: string, incidentType: string, _userEmail?: string, _firstName?: string, lang?: 'en' | 'fr'): Promise<Notification>;
    /**
     * Send incident resolved notification and email
     */
    notifyIncidentResolved(userId: string, incidentId: string, userEmail: string, firstName: string, lang?: 'en' | 'fr'): Promise<Notification>;
    /**
     * Send promotional notification and email to multiple users
     */
    sendPromotionToUsers(userIds: string[], promotionData: {
        subject: string;
        title: string;
        message: string;
        ctaUrl?: string;
    }, userEmails?: Array<{
        userId: string;
        email: string;
        firstName: string;
        lang: 'en' | 'fr';
    }>): Promise<{
        notifications: number;
        emailsSent: number;
        emailsFailed: number;
    }>;
    /**
     * Get user notifications
     */
    getUserNotifications(userId: string, options?: {
        limit?: number;
        offset?: number;
        unreadOnly?: boolean;
    }): Promise<Notification[]>;
    /**
     * Get unread count
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Mark as read
     */
    markAsRead(notificationId: string): Promise<Notification | null>;
    /**
     * Mark all as read
     */
    markAllAsRead(userId: string): Promise<number>;
    /**
     * Delete notification
     */
    deleteNotification(notificationId: string): Promise<boolean>;
    /**
     * Helper method to send notification-specific emails
     */
    private sendNotificationEmail;
    /**
     * Notify admins about new review
     */
    notifyAdminsAboutNewReview(review: any): Promise<void>;
    /**
     * Notify admins about refund request
     */
    notifyAdminsAboutRefundRequest(refund: any): Promise<void>;
    /**
     * Notify admins about new support ticket
     */
    notifyAdminsAboutNewTicket(ticket: any): Promise<void>;
    /**
     * Notify maintenance team about alert
     */
    notifyMaintenanceTeam(alert: any): Promise<void>;
    /**
     * Create a simple notification
     */
    create(data: {
        userId: string;
        type: string;
        category: string;
        title: string;
        message: string;
        read: boolean;
        actionUrl?: string;
    }): Promise<void>;
}
export default NotificationService;
//# sourceMappingURL=NotificationService.d.ts.map