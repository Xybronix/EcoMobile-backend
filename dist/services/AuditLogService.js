"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditActions = exports.AuditLogService = void 0;
const AuditLogRepository_1 = require("../repositories/AuditLogRepository");
const uuid_1 = require("uuid");
class AuditLogService {
    constructor() {
        this.auditRepo = new AuditLogRepository_1.AuditLogRepository();
    }
    async logAction(action, entity, data) {
        const log = {
            id: (0, uuid_1.v4)(),
            action,
            entity,
            ...data,
            status: data.status || 'success',
            createdAt: new Date()
        };
        return await this.auditRepo.create(log);
    }
    async logActionFromRequest(req, action, entity, data) {
        const user = req.user;
        return await this.logAction(action, entity, {
            ...data,
            userId: user?.id,
            userEmail: user?.email,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent')
        });
    }
    async getUserLogs(userId, limit = 100) {
        return await this.auditRepo.findByUserId(userId, limit);
    }
    async getEntityLogs(entity, entityId) {
        return await this.auditRepo.findByEntity(entity, entityId);
    }
    async getLogsByAction(action, limit = 100) {
        return await this.auditRepo.findByAction(action, limit);
    }
    async getLogsByDateRange(startDate, endDate) {
        return await this.auditRepo.findByDateRange(startDate, endDate);
    }
    async getFailures(limit = 50) {
        return await this.auditRepo.findFailures(limit);
    }
    async getStatistics(period) {
        return await this.auditRepo.getStatistics(period);
    }
}
exports.AuditLogService = AuditLogService;
// Predefined action types
exports.AuditActions = {
    // Auth actions
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    USER_REGISTER: 'user.register',
    PASSWORD_RESET: 'user.password_reset',
    PASSWORD_CHANGE: 'user.password_change',
    // User actions
    USER_CREATE: 'user.create',
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete',
    USER_SUSPEND: 'user.suspend',
    USER_ACTIVATE: 'user.activate',
    // Ride actions
    RIDE_START: 'ride.start',
    RIDE_END: 'ride.end',
    RIDE_CANCEL: 'ride.cancel',
    // Wallet actions
    WALLET_CHARGE: 'wallet.charge',
    WALLET_DEDUCT: 'wallet.deduct',
    WALLET_REFUND: 'wallet.refund',
    // Bike actions
    BIKE_CREATE: 'bike.create',
    BIKE_UPDATE: 'bike.update',
    BIKE_DELETE: 'bike.delete',
    BIKE_MAINTENANCE: 'bike.maintenance',
    // Admin actions
    SETTINGS_UPDATE: 'settings.update',
    PROMO_CREATE: 'promo.create',
    PROMO_UPDATE: 'promo.update',
    PROMO_DELETE: 'promo.delete',
    // Refund actions
    REFUND_REQUEST: 'refund.request',
    REFUND_APPROVE: 'refund.approve',
    REFUND_REJECT: 'refund.reject',
    // Ticket actions
    TICKET_CREATE: 'ticket.create',
    TICKET_UPDATE: 'ticket.update',
    TICKET_RESOLVE: 'ticket.resolve',
    // Review actions
    REVIEW_CREATE: 'review.create',
    REVIEW_APPROVE: 'review.approve',
    REVIEW_REJECT: 'review.reject'
};
//# sourceMappingURL=AuditLogService.js.map