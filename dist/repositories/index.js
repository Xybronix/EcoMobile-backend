"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogRepository = exports.PricingConfigRepository = exports.NotificationRepository = exports.ConversationRepository = exports.ChatMessageRepository = exports.MaintenanceRepository = exports.IncidentRepository = exports.TransactionRepository = exports.WalletRepository = exports.SessionRepository = exports.GeofenceRepository = exports.MaintenanceAlertRepository = exports.AuditLogRepository = exports.TicketMessageRepository = exports.SupportTicketRepository = exports.RefundRepository = exports.ReviewRepository = exports.PromoCodeUsageRepository = exports.PromoCodeRepository = exports.RideRepository = exports.BikeRepository = exports.UserRepository = exports.BaseRepository = void 0;
// Repository Exports
var BaseRepository_1 = require("./BaseRepository");
Object.defineProperty(exports, "BaseRepository", { enumerable: true, get: function () { return BaseRepository_1.BaseRepository; } });
var UserRepository_1 = require("./UserRepository");
Object.defineProperty(exports, "UserRepository", { enumerable: true, get: function () { return UserRepository_1.UserRepository; } });
var BikeRepository_1 = require("./BikeRepository");
Object.defineProperty(exports, "BikeRepository", { enumerable: true, get: function () { return BikeRepository_1.BikeRepository; } });
var RideRepository_1 = require("./RideRepository");
Object.defineProperty(exports, "RideRepository", { enumerable: true, get: function () { return RideRepository_1.RideRepository; } });
var PromoCodeRepository_1 = require("./PromoCodeRepository");
Object.defineProperty(exports, "PromoCodeRepository", { enumerable: true, get: function () { return PromoCodeRepository_1.PromoCodeRepository; } });
Object.defineProperty(exports, "PromoCodeUsageRepository", { enumerable: true, get: function () { return PromoCodeRepository_1.PromoCodeUsageRepository; } });
var ReviewRepository_1 = require("./ReviewRepository");
Object.defineProperty(exports, "ReviewRepository", { enumerable: true, get: function () { return ReviewRepository_1.ReviewRepository; } });
var RefundRepository_1 = require("./RefundRepository");
Object.defineProperty(exports, "RefundRepository", { enumerable: true, get: function () { return RefundRepository_1.RefundRepository; } });
var SupportTicketRepository_1 = require("./SupportTicketRepository");
Object.defineProperty(exports, "SupportTicketRepository", { enumerable: true, get: function () { return SupportTicketRepository_1.SupportTicketRepository; } });
Object.defineProperty(exports, "TicketMessageRepository", { enumerable: true, get: function () { return SupportTicketRepository_1.TicketMessageRepository; } });
var AuditLogRepository_1 = require("./AuditLogRepository");
Object.defineProperty(exports, "AuditLogRepository", { enumerable: true, get: function () { return AuditLogRepository_1.AuditLogRepository; } });
var MaintenanceAlertRepository_1 = require("./MaintenanceAlertRepository");
Object.defineProperty(exports, "MaintenanceAlertRepository", { enumerable: true, get: function () { return MaintenanceAlertRepository_1.MaintenanceAlertRepository; } });
var GeofenceRepository_1 = require("./GeofenceRepository");
Object.defineProperty(exports, "GeofenceRepository", { enumerable: true, get: function () { return GeofenceRepository_1.GeofenceRepository; } });
var SessionRepository_1 = require("./SessionRepository");
Object.defineProperty(exports, "SessionRepository", { enumerable: true, get: function () { return SessionRepository_1.SessionRepository; } });
// Additional repositories can be imported here
const BaseRepository_2 = require("./BaseRepository");
class WalletRepository extends BaseRepository_2.BaseRepository {
    constructor() {
        super('wallets');
    }
    async findByUserId(userId) {
        return this.findOne({ userId });
    }
    async updateBalance(walletId, amount) {
        const sql = `UPDATE ${this.tableName} SET balance = balance + ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
        await this.executeNonQuery(sql, [amount, new Date(), walletId]);
    }
}
exports.WalletRepository = WalletRepository;
class TransactionRepository extends BaseRepository_2.BaseRepository {
    constructor() {
        super('transactions');
    }
    async findByUserId(userId) {
        return this.findAll({ where: { userId }, sortBy: 'createdAt', sortOrder: 'DESC' });
    }
    async findByRideId(rideId) {
        return this.findOne({ rideId });
    }
}
exports.TransactionRepository = TransactionRepository;
class IncidentRepository extends BaseRepository_2.BaseRepository {
    constructor() {
        super('incidents');
    }
    async findByUserId(userId) {
        return this.findAll({ where: { userId }, sortBy: 'createdAt', sortOrder: 'DESC' });
    }
    async findByBikeId(bikeId) {
        return this.findAll({ where: { bikeId }, sortBy: 'createdAt', sortOrder: 'DESC' });
    }
    async findByStatus(status) {
        return this.findAll({ where: { status } });
    }
}
exports.IncidentRepository = IncidentRepository;
class MaintenanceRepository extends BaseRepository_2.BaseRepository {
    constructor() {
        super('maintenance');
    }
    async findByBikeId(bikeId) {
        return this.findAll({ where: { bikeId }, sortBy: 'scheduledDate', sortOrder: 'DESC' });
    }
    async findByStatus(status) {
        return this.findAll({ where: { status } });
    }
}
exports.MaintenanceRepository = MaintenanceRepository;
class ChatMessageRepository extends BaseRepository_2.BaseRepository {
    constructor() {
        super('chat_messages');
    }
    async findByConversationId(conversationId) {
        return this.findAll({ where: { conversationId }, sortBy: 'createdAt', sortOrder: 'ASC' });
    }
    async markAsRead(messageId) {
        const sql = `UPDATE ${this.tableName} SET read = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
        await this.executeNonQuery(sql, [true, new Date(), messageId]);
    }
}
exports.ChatMessageRepository = ChatMessageRepository;
class ConversationRepository extends BaseRepository_2.BaseRepository {
    constructor() {
        super('conversations');
    }
    async findByUserId(userId) {
        return this.findAll({ where: { userId }, sortBy: 'lastMessageAt', sortOrder: 'DESC' });
    }
    async updateLastMessage(conversationId) {
        const sql = `UPDATE ${this.tableName} SET lastMessageAt = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
        await this.executeNonQuery(sql, [new Date(), new Date(), conversationId]);
    }
}
exports.ConversationRepository = ConversationRepository;
class NotificationRepository extends BaseRepository_2.BaseRepository {
    constructor() {
        super('notifications');
    }
    async findByUserId(userId, unreadOnly = false) {
        const where = { userId };
        if (unreadOnly) {
            where.read = false;
        }
        return this.findAll({ where, sortBy: 'createdAt', sortOrder: 'DESC' });
    }
    async markAsRead(notificationId) {
        const sql = `UPDATE ${this.tableName} SET read = ${this.getPlaceholder(1)} WHERE id = ${this.getPlaceholder(2)}`;
        await this.executeNonQuery(sql, [true, notificationId]);
    }
    async markAllAsRead(userId) {
        const sql = `UPDATE ${this.tableName} SET read = ${this.getPlaceholder(1)} WHERE userId = ${this.getPlaceholder(2)}`;
        await this.executeNonQuery(sql, [true, userId]);
    }
}
exports.NotificationRepository = NotificationRepository;
class PricingConfigRepository extends BaseRepository_2.BaseRepository {
    constructor() {
        super('pricing_configs');
    }
    async findActive() {
        return this.findAll({ where: { active: true } });
    }
}
exports.PricingConfigRepository = PricingConfigRepository;
class ActivityLogRepository extends BaseRepository_2.BaseRepository {
    constructor() {
        super('activity_logs');
    }
    async findByUserId(userId) {
        return this.findAll({ where: { userId }, sortBy: 'createdAt', sortOrder: 'DESC' });
    }
    async findByEntity(entity, entityId) {
        return this.findAll({ where: { entity, entityId }, sortBy: 'createdAt', sortOrder: 'DESC' });
    }
}
exports.ActivityLogRepository = ActivityLogRepository;
//# sourceMappingURL=index.js.map