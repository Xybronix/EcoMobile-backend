import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter
// For production, use Redis or similar
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export const rateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => {
      // Use IP address and user ID if authenticated
      const userId = (req as any).user?.id || '';
      const ip = req.ip || req.socket.remoteAddress || '';
      return `${ip}:${userId}`;
    }
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
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

// Predefined rate limiters
export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts
  message: 'Too many authentication attempts, please try again later.'
});

export const apiLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60 // 60 requests per minute
});

export const strictLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10 // 10 requests per minute
});
