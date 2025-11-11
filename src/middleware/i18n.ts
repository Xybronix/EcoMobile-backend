import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';

export interface I18nRequest extends Request {
  language?: 'fr' | 'en';
}

export const i18nMiddleware = (req: I18nRequest, _res: Response, next: NextFunction) => {
  // Priority order: query param > header > default
  const langFromQuery = req.query.lang as string;
  const langFromHeader = req.headers['accept-language'];

  let language: 'fr' | 'en' = config.app.defaultLanguage;

  if (langFromQuery && config.app.supportedLanguages.includes(langFromQuery)) {
    language = langFromQuery as 'fr' | 'en';
  } else if (langFromHeader) {
    // Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7")
    const primaryLang = langFromHeader.split(',')[0].split('-')[0].toLowerCase();
    if (config.app.supportedLanguages.includes(primaryLang)) {
      language = primaryLang as 'fr' | 'en';
    }
  }

  req.language = language;
  next();
};
