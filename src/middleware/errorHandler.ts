import express, { Request } from 'express';
import { t } from '../locales';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request & { language?: 'fr' | 'en' },
  res: express.Response,
  _next: express.NextFunction
) => {
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
      error: t('error.validation', language),
      details: err.message
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: t('auth.token.invalid', language)
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: t('auth.token.invalid', language)
    });
  }

  // Handle database errors
  if (err.message.includes('database') || err.message.includes('SQL')) {
    return res.status(500).json({
      success: false,
      error: t('error.database', language)
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: t('error.server', language)
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request & { language?: 'fr' | 'en' }, res: express.Response) => {
  const language = req.language || 'fr';
  res.status(404).json({
    success: false,
    error: t('error.not_found', language)
  });
};
