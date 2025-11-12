"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const public_routes_1 = __importDefault(require("./public.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const bike_routes_1 = __importDefault(require("./bike.routes"));
const ride_routes_1 = __importDefault(require("./ride.routes"));
const wallet_routes_1 = __importDefault(require("./wallet.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const chat_routes_1 = __importDefault(require("./chat.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const router = (0, express_1.Router)();
// Health check
router.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'FreeBike API is running',
        timestamp: new Date().toISOString()
    });
});
// API routes
router.use('/public', public_routes_1.default);
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/bikes', bike_routes_1.default);
router.use('/rides', ride_routes_1.default);
router.use('/wallet', wallet_routes_1.default);
router.use('/admin', admin_routes_1.default);
router.use('/chat', chat_routes_1.default);
router.use('/notifications', notification_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map