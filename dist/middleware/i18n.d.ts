import { Request, Response, NextFunction } from 'express';
export interface I18nRequest extends Request {
    language?: 'fr' | 'en';
}
export declare const i18nMiddleware: (req: I18nRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=i18n.d.ts.map