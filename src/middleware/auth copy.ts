import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { prisma } from '../config/prisma';
import { UserRole } from '@prisma/client';
import { t } from '../locales';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        roleId: string | null;
        permissions: string[];
      };
      language?: 'fr' | 'en';
    }
  }
}

interface LogRequest {
  ip?: string;
  connection?: {
    remoteAddress?: string;
  };
  headers?: {
    'user-agent'?: string;
  };
}

export type AuthRequest = Request;

// Service pour logger les activités
export const logActivity = async (
  userId: string | null,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string,
  metadata?: any,
  req?: LogRequest
) => {
  try {
    await prisma.activityLog.create({
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
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: t('auth.token.missing', req.language)
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const secret = config.jwt.secret;
      if (!secret) {
        throw new Error('JWT secret is not configured');
      }

      const decoded = jwt.verify(token, secret as string) as {
        id: string;
        email: string;
        role: string;
        roleId: string;
      };

      // Récupérer les permissions de l'utilisateur
      const userWithPermissions = await prisma.user.findUnique({
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
          error: t('auth.user.not_found', req.language)
        });
        return;
      }

      if (!userWithPermissions.isActive || userWithPermissions.status !== 'active') {
        res.status(403).json({
          success: false,
          error: t('auth.account.deactivated', req.language)
        });
        return;
      }

      const permissions = userWithPermissions.roleRelation?.permissions.map(
        rp => `${rp.permission.resource}:${rp.permission.action}`
      );

      req.user = {
        id: userWithPermissions.id,
        email: userWithPermissions.email,
        role: userWithPermissions.role,
        roleId: userWithPermissions.roleId,
        permissions: permissions || []
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: t('auth.token.invalid', req.language)
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: t('error.server', req.language)
    });
    return;
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: t('auth.unauthorized', req.language)
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: t('auth.forbidden', req.language)
      });
      return;
    }

    next();
  };
};

export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: t('auth.unauthorized', req.language)
      });
      return;
    }

    const requiredPermission = `${resource}:${action}`;
    const hasPermission = req.user.permissions?.includes(requiredPermission) || 
                         req.user.permissions?.includes(`${resource}:manage`) ||
                         req.user.permissions?.includes('admin:manage');

    if (!hasPermission) {
      // Logger la tentative d'accès non autorisée
      await logActivity(
        req.user.id,
        'ACCESS_DENIED',
        resource,
        '',
        `Attempted ${action} on ${resource} without permission`,
        { requiredPermission, userPermissions: req.user.permissions },
        req
      );

      res.status(403).json({
        success: false,
        error: t('auth.insufficient_permissions', req.language)
      });
      return;
    }

    next();
  };
};

export const requireAdmin = authorize('ADMIN', 'SUPER_ADMIN');

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const secret = config.jwt.secret;
        if (secret) {
          const decoded = jwt.verify(token, secret as string) as {
            id: string;
            email: string;
            role: string;
            roleId: string;
          };

          const user = await prisma.user.findUnique({
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
            const permissions = user.roleRelation?.permissions?.map(
              (rp: any) => `${rp.permission.resource}:${rp.permission.action}`
            ) || [];

            req.user = {
              id: user.id,
              email: user.email,
              role: user.role,
              roleId: user.roleId,
              permissions
            };
          }
        }
      } catch (error) {
        // Token invalid but continue anyway
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const generateToken = (user: { id: string; email: string; role: string; roleId: string }): string => {
  const secret = config.jwt.secret;
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
  
  return jwt.sign(payload, secret as string, options);
};

export const generateRefreshToken = (user: { id: string; email: string; role: string; roleId: string }): string => {
  const refreshSecret = config.jwt.refreshSecret;
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
  
  return jwt.sign(payload, refreshSecret as string, options);
};

export const verifyRefreshToken = (token: string): { id: string; email: string; role: string; roleId: string } | null => {
  try {
    const refreshSecret = config.jwt.refreshSecret;
    if (!refreshSecret) {
      return null;
    }
    
    return jwt.verify(token, refreshSecret as string) as {
      id: string;
      email: string;
      role: string;
      roleId: string;
    };
  } catch (error) {
    return null;
  }
};