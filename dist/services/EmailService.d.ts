export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}
export interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
}
declare class EmailService {
    private transporter;
    constructor();
    /**
     * Check if email service is properly configured
     */
    isConfigured(): boolean;
    /**
     * Send an email
     */
    sendEmail(options: EmailOptions): Promise<boolean>;
    /**
     * Send bulk emails (for promotions/announcements)
     */
    sendBulkEmails(recipients: string[], subject: string, html: string): Promise<{
        success: number;
        failed: number;
        errors: Array<{
            email: string;
            error: string;
        }>;
    }>;
    /**
     * Generate Welcome Email Template
     */
    generateWelcomeEmail(firstName: string, _lang: 'en' | 'fr', translations: any): EmailTemplate;
    /**
     * Generate Password Reset Email Template
     */
    generatePasswordResetEmail(firstName: string, resetToken: string, _lang: 'en' | 'fr', translations: any): EmailTemplate;
    /**
     * Generate Ride Completed Email Template
     */
    generateRideCompletedEmail(firstName: string, rideDetails: {
        duration: number;
        distance: number;
        cost: number;
    }, _lang: 'en' | 'fr', translations: any): EmailTemplate;
    /**
     * Generate Deposit Confirmation Email Template
     */
    generateDepositEmail(firstName: string, amount: number, balance: number, _lang: 'en' | 'fr', translations: any): EmailTemplate;
    /**
     * Generate Promotion Email Template
     */
    generatePromotionEmail(firstName: string, promotionData: {
        subject: string;
        title: string;
        message: string;
        ctaUrl?: string;
    }, _lang: 'en' | 'fr', translations: any): EmailTemplate;
    /**
     * Generate Incident Resolved Email Template
     */
    generateIncidentResolvedEmail(firstName: string, incidentId: string, _lang: 'en' | 'fr', translations: any): EmailTemplate;
    /**
     * Generate Review Submitted Confirmation Email Template
     */
    generateReviewSubmittedEmail(firstName: string, lastName: string, _lang: 'en' | 'fr', translations: any): EmailTemplate;
    /**
     * Generate New Review Notification Email Template (for admins)
     */
    generateNewReviewNotificationEmail(review: any, _lang: 'en' | 'fr', translations: any): EmailTemplate;
    /**
     * Base HTML Email Template
     */
    private generateEmailTemplate;
    /**
     * Strip HTML tags from text
     */
    private stripHtml;
    /**
     * Verify SMTP connection
     */
    verifyConnection(): Promise<boolean>;
}
export default EmailService;
//# sourceMappingURL=EmailService.d.ts.map