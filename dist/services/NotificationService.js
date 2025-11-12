"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const NotificationRepository_1 = __importDefault(require("../repositories/NotificationRepository"));
const EmailService_1 = __importDefault(require("./EmailService"));
const locales_1 = require("../locales");
class NotificationService {
    constructor() {
        this.emailService = new EmailService_1.default();
    }
    /**
     * Create a notification (and optionally send email)
     */
    async createNotification(data) {
        // Create notification in database
        const notification = await NotificationRepository_1.default.createNotification({
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type,
        });
        // Send email if requested
        if (data.sendEmail && data.emailData) {
            try {
                await this.sendNotificationEmail(data.type, data.emailData, {
                    title: data.title,
                    message: data.message,
                });
            }
            catch (error) {
                console.error('Failed to send notification email:', error);
                // Don't throw - notification was created successfully
            }
        }
        return notification;
    }
    /**
     * Bulk delete notifications
     */
    async bulkDeleteNotifications(notificationIds) {
        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            throw new Error('Invalid notification IDs provided');
        }
        await NotificationRepository_1.default.bulkDeleteNotifications(notificationIds);
    }
    /**
     * Create notification for ride started
     */
    async notifyRideStarted(userId, bikeCode, _userEmail, _firstName, lang = 'fr') {
        const title = (0, locales_1.t)('notification.ride_started', lang);
        const bikeMessage = (0, locales_1.t)('bike.not_found', lang).replace('Vélo non trouvé', `Bike ${bikeCode}`).replace('Bike not found', `Bike ${bikeCode}`);
        return await this.createNotification({
            userId,
            title,
            message: `${title} - ${bikeMessage}`,
            type: 'RIDE_STARTED',
            sendEmail: false, // Usually don't send email for ride start
        });
    }
    /**
     * Create notification for ride ended
     */
    async notifyRideEnded(userId, rideDetails, userEmail, firstName, lang = 'fr') {
        const message = (0, locales_1.t)('notification.ride_ended', lang).replace('{{cost}}', rideDetails.cost.toFixed(0));
        const notification = await this.createNotification({
            userId,
            title: (0, locales_1.t)('ride.ended', lang),
            message,
            type: 'RIDE_ENDED',
            sendEmail: true,
            emailData: {
                userEmail,
                firstName,
                lang,
            },
        });
        // Send detailed ride completion email
        try {
            const emailTemplate = this.emailService.generateRideCompletedEmail(firstName, rideDetails, lang, locales_1.t);
            await this.emailService.sendEmail({
                to: userEmail,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
            });
        }
        catch (error) {
            console.error('Failed to send ride completion email:', error);
        }
        return notification;
    }
    /**
     * Create notification for wallet deposit
     */
    async notifyWalletDeposit(userId, amount, balance, userEmail, firstName, lang = 'fr') {
        const message = (0, locales_1.t)('notification.wallet_deposit', lang).replace('{{amount}}', amount.toFixed(0));
        const notification = await this.createNotification({
            userId,
            title: (0, locales_1.t)('wallet.deposit_success', lang),
            message,
            type: 'WALLET_DEPOSIT',
            sendEmail: true,
            emailData: {
                userEmail,
                firstName,
                lang,
            },
        });
        // Send deposit confirmation email
        try {
            const emailTemplate = this.emailService.generateDepositEmail(firstName, amount, balance, lang, locales_1.t);
            await this.emailService.sendEmail({
                to: userEmail,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
            });
        }
        catch (error) {
            console.error('Failed to send deposit email:', error);
        }
        return notification;
    }
    /**
     * Create notification for wallet withdrawal
     */
    async notifyWalletWithdrawal(userId, amount, _userEmail, _firstName, lang = 'fr') {
        const message = (0, locales_1.t)('notification.wallet_withdrawal', lang).replace('{{amount}}', amount.toFixed(0));
        return await this.createNotification({
            userId,
            title: (0, locales_1.t)('wallet.withdrawal_success', lang),
            message,
            type: 'WALLET_WITHDRAWAL',
            sendEmail: false, // Usually don't send email for withdrawals
        });
    }
    /**
     * Create notification for ride payment
     */
    async notifyRidePayment(userId, amount, _userEmail, _firstName, lang = 'fr') {
        const message = (0, locales_1.t)('notification.ride_payment', lang).replace('{{amount}}', amount.toFixed(0));
        return await this.createNotification({
            userId,
            title: (0, locales_1.t)('payment.completed', lang),
            message,
            type: 'RIDE_PAYMENT',
            sendEmail: false,
        });
    }
    /**
     * Send welcome notification and email
     */
    async sendWelcomeNotification(userId, userEmail, firstName, lang = 'fr') {
        const notification = await this.createNotification({
            userId,
            title: (0, locales_1.t)('notification.account_created', lang),
            message: (0, locales_1.t)('auth.register.success', lang),
            type: 'ACCOUNT_CREATED',
            sendEmail: false, // Will send custom email below
        });
        // Send welcome email
        try {
            const emailTemplate = this.emailService.generateWelcomeEmail(firstName, lang, locales_1.t);
            await this.emailService.sendEmail({
                to: userEmail,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
            });
        }
        catch (error) {
            console.error('Failed to send welcome email:', error);
        }
        return notification;
    }
    /**
     * Send password reset notification and email
     */
    async sendPasswordResetNotification(userId, userEmail, firstName, resetToken, lang = 'fr') {
        // Create notification
        await this.createNotification({
            userId,
            title: (0, locales_1.t)('notification.password_reset_requested', lang),
            message: (0, locales_1.t)('auth.password.reset.success', lang),
            type: 'PASSWORD_RESET',
            sendEmail: false, // Will send custom email below
        });
        // Send password reset email
        try {
            const emailTemplate = this.emailService.generatePasswordResetEmail(firstName, resetToken, lang, locales_1.t);
            await this.emailService.sendEmail({
                to: userEmail,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
            });
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
            throw error; // Re-throw for password reset as email is critical
        }
    }
    /**
     * Send incident reported notification
     */
    async notifyIncidentReported(userId, _incidentId, incidentType, _userEmail, _firstName, lang = 'fr') {
        const title = (0, locales_1.t)('notification.incident_reported', lang);
        return await this.createNotification({
            userId,
            title,
            message: `${title} - ${incidentType}`,
            type: 'INCIDENT_REPORTED',
            sendEmail: false,
        });
    }
    /**
     * Send incident resolved notification and email
     */
    async notifyIncidentResolved(userId, incidentId, userEmail, firstName, lang = 'fr') {
        const title = (0, locales_1.t)('notification.incident_resolved', lang);
        const notification = await this.createNotification({
            userId,
            title,
            message: title,
            type: 'INCIDENT_RESOLVED',
            sendEmail: true,
            emailData: {
                userEmail,
                firstName,
                lang,
            },
        });
        // Send incident resolved email
        try {
            const emailTemplate = this.emailService.generateIncidentResolvedEmail(firstName, incidentId, lang, locales_1.t);
            await this.emailService.sendEmail({
                to: userEmail,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
            });
        }
        catch (error) {
            console.error('Failed to send incident resolved email:', error);
        }
        return notification;
    }
    /**
     * Send promotional notification and email to multiple users
     */
    async sendPromotionToUsers(userIds, promotionData, userEmails) {
        // Create notifications in bulk
        const notificationData = userIds.map(userId => ({
            userId,
            title: promotionData.title,
            message: promotionData.message,
            type: 'PROMOTION',
        }));
        const notificationsCreated = await NotificationRepository_1.default.createBulkNotifications(notificationData);
        // Send emails if user emails provided
        let emailsSent = 0;
        let emailsFailed = 0;
        if (userEmails && userEmails.length > 0) {
            for (const user of userEmails) {
                try {
                    const emailTemplate = this.emailService.generatePromotionEmail(user.firstName, promotionData, user.lang, locales_1.t);
                    await this.emailService.sendEmail({
                        to: user.email,
                        subject: emailTemplate.subject,
                        html: emailTemplate.html,
                    });
                    emailsSent++;
                }
                catch (error) {
                    console.error(`Failed to send promotion email to ${user.email}:`, error);
                    emailsFailed++;
                }
            }
        }
        return {
            notifications: notificationsCreated,
            emailsSent,
            emailsFailed,
        };
    }
    /**
     * Get user notifications
     */
    async getUserNotifications(userId, options) {
        return await NotificationRepository_1.default.findByUserId(userId, options);
    }
    /**
     * Get unread count
     */
    async getUnreadCount(userId) {
        return await NotificationRepository_1.default.getUnreadCount(userId);
    }
    /**
     * Mark as read
     */
    async markAsRead(notificationId) {
        return await NotificationRepository_1.default.markAsRead(notificationId);
    }
    /**
     * Mark all as read
     */
    async markAllAsRead(userId) {
        return await NotificationRepository_1.default.markAllAsRead(userId);
    }
    /**
     * Delete notification
     */
    async deleteNotification(notificationId) {
        return await NotificationRepository_1.default.deleteNotification(notificationId);
    }
    /**
     * Helper method to send notification-specific emails
     */
    async sendNotificationEmail(_type, emailData, content) {
        // This is a fallback for generic notification emails
        // Specific notification types should use their dedicated email methods
        const { userEmail, firstName } = emailData;
        const html = `
      <h2>${content.title}</h2>
      <p>Hello ${firstName},</p>
      <p>${content.message}</p>
      <p>Best regards,<br>FreeBike Team</p>
    `;
        await this.emailService.sendEmail({
            to: userEmail,
            subject: content.title,
            html,
        });
    }
    /**
     * Notify admins about new review
     */
    async notifyAdminsAboutNewReview(review) {
        // This would notify admins in a real implementation
        console.log('New review pending approval:', review.id);
    }
    /**
     * Notify admins about refund request
     */
    async notifyAdminsAboutRefundRequest(refund) {
        // This would notify admins in a real implementation
        console.log('New refund request:', refund.id);
    }
    /**
     * Notify admins about new support ticket
     */
    async notifyAdminsAboutNewTicket(ticket) {
        // This would notify admins in a real implementation
        console.log('New support ticket:', ticket.id);
    }
    /**
     * Notify maintenance team about alert
     */
    async notifyMaintenanceTeam(alert) {
        // This would notify maintenance team in a real implementation
        console.log('New maintenance alert:', alert.id);
    }
    /**
     * Create a simple notification
     */
    async create(data) {
        await this.createNotification({
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type,
        });
    }
}
exports.default = NotificationService;
//# sourceMappingURL=NotificationService.js.map