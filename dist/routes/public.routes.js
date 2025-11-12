"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AdminController_1 = __importDefault(require("../controllers/AdminController"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/v1/public/pricing
 * @desc    Get current pricing (public)
 * @access  Public
 */
router.get('/pricing', AdminController_1.default.getCurrentPricing);
/**
 * @route   GET /api/v1/public/company
 * @desc    Get company information (public)
 * @access  Public
 */
router.get('/company', AdminController_1.default.getSettings);
/**
 * @route   GET /api/v1/public/reviews
 * @desc    Get approved reviews (public)
 * @access  Public
 */
router.get('/reviews', AdminController_1.default.getApprovedReviews);
/**
 * @route   POST /api/v1/public/reviews
 * @desc    Submit a review (public)
 * @access  Public
 */
router.post('/reviews', AdminController_1.default.submitReview);
exports.default = router;
//# sourceMappingURL=public.routes.js.map