"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.generateRefreshToken = exports.generateToken = exports.optionalAuth = exports.requireAdmin = exports.requirePermission = exports.authorize = exports.authenticate = exports.logActivity = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const prisma_1 = require("../config/prisma");
const locales_1 = require("../locales");
// Service pour logger les activités
const logActivity = async (userId, action, resource, resourceId, details, metadata, req) => {
    try {
        await prisma_1.prisma.activityLog.create({
            data: {
                userId,
                action,
                resource,
                resourceId,
                details,
                metadata,
                ipAddress: req?.ip || req?.connection?.remoteAddress,
                userAgent: req?.headers?.['user-agent']
            }
        });
    }
    catch (error) {
        console.error('Failed to log activity:', error);
    }
};
exports.logActivity = logActivity;
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: (0, locales_1.t)('auth.token.missing', req.language)
            });
            return;
        }
        const token = authHeader.substring(7);
        try {
            const secret = config_1.config.jwt.secret;
            if (!secret) {
                throw new Error('JWT secret is not configured');
            }
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            // Récupérer les permissions de l'utilisateur
            const userWithPermissions = await prisma_1.prisma.user.findUnique({
                where: { id: decoded.id },
                include: {
                    roleRelation: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            });
            if (!userWithPermissions) {
                res.status(401).json({
                    success: false,
                    error: (0, locales_1.t)('auth.user.not_found', req.language)
                });
                return;
            }
            if (!userWithPermissions.isActive || userWithPermissions.status !== 'active') {
                res.status(403).json({
                    success: false,
                    error: (0, locales_1.t)('auth.account.deactivated', req.language)
                });
                return;
            }
            const permissions = userWithPermissions.roleRelation?.permissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`);
            req.user = {
                id: userWithPermissions.id,
                email: userWithPermissions.email,
                role: userWithPermissions.role,
                roleId: userWithPermissions.roleId,
                permissions: permissions || []
            };
            next();
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: (0, locales_1.t)('auth.token.invalid', req.language)
            });
            return;
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: (0, locales_1.t)('error.server', req.language)
        });
        return;
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: (0, locales_1.t)('auth.unauthorized', req.language)
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: (0, locales_1.t)('auth.forbidden', req.language)
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const requirePermission = (resource, action) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: (0, locales_1.t)('auth.unauthorized', req.language)
            });
            return;
        }
        const requiredPermission = `${resource}:${action}`;
        const hasPermission = req.user.permissions?.includes(requiredPermission) ||
            req.user.permissions?.includes(`${resource}:manage`) ||
            req.user.permissions?.includes('admin:manage');
        if (!hasPermission) {
            // Logger la tentative d'accès non autorisée
            await (0, exports.logActivity)(req.user.id, 'ACCESS_DENIED', resource, '', `Attempted ${action} on ${resource} without permission`, { requiredPermission, userPermissions: req.user.permissions }, req);
            res.status(403).json({
                success: false,
                error: (0, locales_1.t)('auth.insufficient_permissions', req.language)
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
exports.requireAdmin = (0, exports.authorize)('ADMIN', 'SUPER_ADMIN');
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const secret = config_1.config.jwt.secret;
                if (secret) {
                    const decoded = jsonwebtoken_1.default.verify(token, secret);
                    const user = await prisma_1.prisma.user.findUnique({
                        where: { id: decoded.id },
                        include: {
                            roleRelation: {
                                include: {
                                    permissions: {
                                        include: {
                                            permission: true
                                        }
                                    }
                                }
                            }
                        }
                    });
                    if (user) {
                        const permissions = user.roleRelation?.permissions?.map((rp) => `${rp.permission.resource}:${rp.permission.action}`) || [];
                        req.user = {
                            id: user.id,
                            email: user.email,
                            role: user.role,
                            roleId: user.roleId,
                            permissions
                        };
                    }
                }
            }
            catch (error) {
                // Token invalid but continue anyway
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const generateToken = (user) => {
    const secret = config_1.config.jwt.secret;
    if (!secret) {
        throw new Error('JWT secret is not configured');
    }
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        roleId: user.roleId
    };
    const options = {
        expiresIn: '24h'
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.generateToken = generateToken;
const generateRefreshToken = (user) => {
    const refreshSecret = config_1.config.jwt.refreshSecret;
    if (!refreshSecret) {
        throw new Error('JWT refresh secret is not configured');
    }
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        roleId: user.roleId
    };
    const options = {
        expiresIn: '7d'
    };
    return jsonwebtoken_1.default.sign(payload, refreshSecret, options);
};
exports.generateRefreshToken = generateRefreshToken;
const verifyRefreshToken = (token) => {
    try {
        const refreshSecret = config_1.config.jwt.refreshSecret;
        if (!refreshSecret) {
            return null;
        }
        return jsonwebtoken_1.default.verify(token, refreshSecret);
    }
    catch (error) {
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=auth.js.map