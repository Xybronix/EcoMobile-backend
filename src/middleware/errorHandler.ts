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
    // Si le message est une clé i18n (contient un point et pas d'espaces), le traduire
    let errorMessage = err.message;
    // Détecter si c'est une clé i18n : contient des points, pas d'espaces, et commence par une lettre
    if (err.message.includes('.') && !err.message.includes(' ') && /^[a-z]/.test(err.message)) {
      // C'est probablement une clé i18n, la traduire
      const translated = t(err.message, language);
      // Si la traduction retourne la même chose, ce n'était pas une clé valide
      errorMessage = translated !== err.message ? translated : err.message;
    }
    
    return res.status(err.statusCode).json({
      success: false,
      error: errorMessage
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message || t('error.validation', language),
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
      error: err.message || t('error.database', language)
    });
  }

  // Default error - préserver le message d'erreur si disponible
  return res.status(500).json({
    success: false,
    error: err.message || t('error.server', language)
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
