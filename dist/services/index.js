"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.ChatService = exports.IncidentService = exports.WalletService = exports.BikeService = exports.UserService = exports.HealthCheckService = exports.StatisticsService = exports.GeofenceService = exports.MaintenanceAlertService = exports.AuditActions = exports.AuditLogService = exports.SupportTicketService = exports.RefundService = exports.ReviewService = exports.PromoCodeService = exports.RideService = exports.AuthService = void 0;
// Service Exports
var AuthService_1 = require("./AuthService");
Object.defineProperty(exports, "AuthService", { enumerable: true, get: function () { return AuthService_1.AuthService; } });
var RideService_1 = require("./RideService");
Object.defineProperty(exports, "RideService", { enumerable: true, get: function () { return RideService_1.RideService; } });
var PromoCodeService_1 = require("./PromoCodeService");
Object.defineProperty(exports, "PromoCodeService", { enumerable: true, get: function () { return PromoCodeService_1.PromoCodeService; } });
var ReviewService_1 = require("./ReviewService");
Object.defineProperty(exports, "ReviewService", { enumerable: true, get: function () { return ReviewService_1.ReviewService; } });
var RefundService_1 = require("./RefundService");
Object.defineProperty(exports, "RefundService", { enumerable: true, get: function () { return RefundService_1.RefundService; } });
var SupportTicketService_1 = require("./SupportTicketService");
Object.defineProperty(exports, "SupportTicketService", { enumerable: true, get: function () { return SupportTicketService_1.SupportTicketService; } });
var AuditLogService_1 = require("./AuditLogService");
Object.defineProperty(exports, "AuditLogService", { enumerable: true, get: function () { return AuditLogService_1.AuditLogService; } });
Object.defineProperty(exports, "AuditActions", { enumerable: true, get: function () { return AuditLogService_1.AuditActions; } });
var MaintenanceAlertService_1 = require("./MaintenanceAlertService");
Object.defineProperty(exports, "MaintenanceAlertService", { enumerable: true, get: function () { return MaintenanceAlertService_1.MaintenanceAlertService; } });
var GeofenceService_1 = require("./GeofenceService");
Object.defineProperty(exports, "GeofenceService", { enumerable: true, get: function () { return GeofenceService_1.GeofenceService; } });
var StatisticsService_1 = require("./StatisticsService");
Object.defineProperty(exports, "StatisticsService", { enumerable: true, get: function () { return StatisticsService_1.StatisticsService; } });
var HealthCheckService_1 = require("./HealthCheckService");
Object.defineProperty(exports, "HealthCheckService", { enumerable: true, get: function () { return HealthCheckService_1.HealthCheckService; } });
const repositories_1 = require("../repositories");
const errorHandler_1 = require("../middleware/errorHandler");
const locales_1 = require("../locales");
class UserService {
    constructor() {
        this.userRepository = new repositories_1.UserRepository();
    }
    async getAllUsers(page = 1, limit = 10, role) {
        const where = role ? { role } : undefined;
        return this.userRepository.findAll({ page, limit, where });
    }
    async getUserById(userId, language = 'fr') {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError((0, locales_1.t)('user.not_found', language), 404);
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updateUser(userId, data, language = 'fr') {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError((0, locales_1.t)('user.not_found', language), 404);
        }
        return this.userRepository.update(userId, data);
    }
    async deleteUser(userId, language = 'fr') {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new errorHandler_1.AppError((0, locales_1.t)('user.not_found', language), 404);
        }
        return this.userRepository.delete(userId);
    }
}
exports.UserService = UserService;
class BikeService {
    constructor() {
        this.bikeRepository = new repositories_1.BikeRepository();
    }
    async getAllBikes(page = 1, limit = 10, status) {
        const where = status ? { status } : undefined;
        return this.bikeRepository.findAll({ page, limit, where });
    }
    async getBikeById(bikeId, language = 'fr') {
        const bike = await this.bikeRepository.findById(bikeId);
        if (!bike) {
            throw new errorHandler_1.AppError((0, locales_1.t)('bike.not_found', language), 404);
        }
        return bike;
    }
    async getAvailableBikes() {
        return this.bikeRepository.findAvailableBikes();
    }
    async getNearbyBikes(latitude, longitude, radius = 5) {
        return this.bikeRepository.findNearby(latitude, longitude, radius);
    }
    async createBike(data) {
        return this.bikeRepository.create(data);
    }
    async updateBike(bikeId, data, language = 'fr') {
        const bike = await this.bikeRepository.findById(bikeId);
        if (!bike) {
            throw new errorHandler_1.AppError((0, locales_1.t)('bike.not_found', language), 404);
        }
        return this.bikeRepository.update(bikeId, data);
    }
    async deleteBike(bikeId, language = 'fr') {
        const bike = await this.bikeRepository.findById(bikeId);
        if (!bike) {
            throw new errorHandler_1.AppError((0, locales_1.t)('bike.not_found', language), 404);
        }
        return this.bikeRepository.delete(bikeId);
    }
}
exports.BikeService = BikeService;
class WalletService {
    constructor() {
        this.walletRepository = new repositories_1.WalletRepository();
        this.transactionRepository = new repositories_1.TransactionRepository();
    }
    async getUserWallet(userId, language = 'fr') {
        const wallet = await this.walletRepository.findByUserId(userId);
        if (!wallet) {
            throw new errorHandler_1.AppError((0, locales_1.t)('wallet.not_found', language), 404);
        }
        return wallet;
    }
    async chargeWallet(userId, amount, language = 'fr') {
        const wallet = await this.walletRepository.findByUserId(userId);
        if (!wallet) {
            throw new errorHandler_1.AppError((0, locales_1.t)('wallet.not_found', language), 404);
        }
        await this.walletRepository.updateBalance(wallet.id, amount);
        await this.transactionRepository.create({
            userId,
            type: 'charge',
            amount,
            currency: 'EUR',
            status: 'completed',
            description: language === 'fr' ? 'Rechargement du portefeuille' : 'Wallet charge'
        });
        return this.walletRepository.findById(wallet.id);
    }
    async getTransactions(userId) {
        return this.transactionRepository.findByUserId(userId);
    }
}
exports.WalletService = WalletService;
class IncidentService {
    constructor() {
        this.incidentRepository = new repositories_1.IncidentRepository();
    }
    async createIncident(data) {
        return this.incidentRepository.create(data);
    }
    async getIncident(incidentId, language = 'fr') {
        const incident = await this.incidentRepository.findById(incidentId);
        if (!incident) {
            throw new errorHandler_1.AppError((0, locales_1.t)('incident.not_found', language), 404);
        }
        return incident;
    }
    async getUserIncidents(userId) {
        return this.incidentRepository.findByUserId(userId);
    }
    async getAllIncidents(page = 1, limit = 10) {
        return this.incidentRepository.findAll({ page, limit });
    }
    async updateIncident(incidentId, data, language = 'fr') {
        const incident = await this.incidentRepository.findById(incidentId);
        if (!incident) {
            throw new errorHandler_1.AppError((0, locales_1.t)('incident.not_found', language), 404);
        }
        return this.incidentRepository.update(incidentId, data);
    }
}
exports.IncidentService = IncidentService;
class ChatService {
    constructor() {
        this.conversationRepository = new repositories_1.ConversationRepository();
        this.messageRepository = new repositories_1.ChatMessageRepository();
    }
    async createConversation(userId, subject) {
        return this.conversationRepository.create({
            userId,
            subject,
            status: 'open',
            priority: 'medium',
            lastMessageAt: new Date()
        });
    }
    async getUserConversations(userId) {
        return this.conversationRepository.findByUserId(userId);
    }
    async sendMessage(conversationId, senderId, senderType, message) {
        const newMessage = await this.messageRepository.create({
            conversationId,
            senderId,
            senderType,
            message,
            read: false
        });
        await this.conversationRepository.updateLastMessage(conversationId);
        return newMessage;
    }
    async getConversationMessages(conversationId) {
        return this.messageRepository.findByConversationId(conversationId);
    }
    async markMessageAsRead(messageId) {
        return this.messageRepository.markAsRead(messageId);
    }
}
exports.ChatService = ChatService;
class NotificationService {
    constructor() {
        this.notificationRepository = new repositories_1.NotificationRepository();
    }
    async getUserNotifications(userId, unreadOnly = false) {
        return this.notificationRepository.findByUserId(userId, unreadOnly);
    }
    async markAsRead(notificationId) {
        return this.notificationRepository.markAsRead(notificationId);
    }
    async markAllAsRead(userId) {
        return this.notificationRepository.markAllAsRead(userId);
    }
    async createNotification(data) {
        return this.notificationRepository.create(data);
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=index.js.map