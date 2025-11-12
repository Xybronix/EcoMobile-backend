import { Request, Response, NextFunction } from 'express';
export interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
}
export declare const rateLimiter: (options: RateLimitOptions) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const authLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const apiLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const strictLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=rateLimiter.d.ts.map