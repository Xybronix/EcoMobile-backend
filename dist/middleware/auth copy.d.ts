import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
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
export declare const logActivity: (userId: string | null, action: string, resource: string, resourceId?: string, details?: string, metadata?: any, req?: LogRequest) => Promise<void>;
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePermission: (resource: string, action: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: AuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const generateToken: (user: {
    id: string;
    email: string;
    role: string;
    roleId: string;
}) => string;
export declare const generateRefreshToken: (user: {
    id: string;
    email: string;
    role: string;
    roleId: string;
}) => string;
export declare const verifyRefreshToken: (token: string) => {
    id: string;
    email: string;
    role: string;
    roleId: string;
} | null;
export {};
//# sourceMappingURL=auth%20copy.d.ts.map