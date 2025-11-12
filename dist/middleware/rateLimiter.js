"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictLimiter = exports.apiLimiter = exports.authLimiter = exports.rateLimiter = void 0;
const store = {};
// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}, 5 * 60 * 1000);
const rateLimiter = (options) => {
    const { windowMs, maxRequests, message = 'Too many requests, please try again later.', keyGenerator = (req) => {
        // Use IP address and user ID if authenticated
        const userId = req.user?.id || '';
        const ip = req.ip || req.socket.remoteAddress || '';
        return `${ip}:${userId}`;
    } } = options;
    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();
        if (!store[key] || store[key].resetTime < now) {
            // Initialize or reset
            store[key] = {
                count: 1,
                resetTime: now + windowMs
            };
            res.setHeader('X-RateLimit-Limit', maxRequests.toString());
            res.setHeader('X-RateLimit-Remaining', (maxRequests - 1).toString());
            res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());
            return next();
        }
        store[key].count++;
        const remaining = Math.max(0, maxRequests - store[key].count);
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());
        if (store[key].count > maxRequests) {
            res.setHeader('Retry-After', Math.ceil((store[key].resetTime - now) / 1000).toString());
            return res.status(429).json({
                success: false,
                error: message,
                retryAfter: new Date(store[key].resetTime)
            });
        }
        next();
    };
};
exports.rateLimiter = rateLimiter;
// Predefined rate limiters
exports.authLimiter = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts
    message: 'Too many authentication attempts, please try again later.'
});
exports.apiLimiter = (0, exports.rateLimiter)({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
});
exports.strictLimiter = (0, exports.rateLimiter)({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // 10 requests per minute
});
//# sourceMappingURL=rateLimiter.js.map