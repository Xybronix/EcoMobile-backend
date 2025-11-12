"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.AppError = void 0;
const locales_1 = require("../locales");
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, _next) => {
    const language = req.language || 'fr';
    // Log error
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    // Handle known errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }
    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: (0, locales_1.t)('error.validation', language),
            details: err.message
        });
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: (0, locales_1.t)('auth.token.invalid', language)
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: (0, locales_1.t)('auth.token.invalid', language)
        });
    }
    // Handle database errors
    if (err.message.includes('database') || err.message.includes('SQL')) {
        return res.status(500).json({
            success: false,
            error: (0, locales_1.t)('error.database', language)
        });
    }
    // Default error
    return res.status(500).json({
        success: false,
        error: (0, locales_1.t)('error.server', language)
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const notFoundHandler = (req, res) => {
    const language = req.language || 'fr';
    res.status(404).json({
        success: false,
        error: (0, locales_1.t)('error.not_found', language)
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map