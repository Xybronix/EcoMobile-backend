import express, { Request } from 'express';
import { config } from '../config/config';

export const i18nMiddleware = (req: Request, _res: express.Response, next: express.NextFunction) => {
  // Priority order: query param > header > default
  const langFromQuery = req.query.lang as string;
  const langFromHeader = req.headers['accept-language'] as string;

  let language: 'fr' | 'en' = 'fr';

  try {
    if (config?.app?.defaultLanguage) {
      language = config.app.defaultLanguage as 'fr' | 'en';
    }
  } catch (error) {
    language = 'fr';
  }

  if (langFromQuery && ['fr', 'en'].includes(langFromQuery)) {
    language = langFromQuery as 'fr' | 'en';
  } else if (langFromHeader) {
    // Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7")
    const primaryLang = langFromHeader.split(',')[0].split('-')[0].toLowerCase();
    if (['fr', 'en'].includes(primaryLang)) {
      language = primaryLang as 'fr' | 'en';
    }
  }

  (req as any).language = language;
  next();
};
