"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nMiddleware = void 0;
const config_1 = require("../config/config");
const i18nMiddleware = (req, _res, next) => {
    // Priority order: query param > header > default
    const langFromQuery = req.query.lang;
    const langFromHeader = req.headers['accept-language'];
    let language = config_1.config.app.defaultLanguage;
    if (langFromQuery && config_1.config.app.supportedLanguages.includes(langFromQuery)) {
        language = langFromQuery;
    }
    else if (langFromHeader) {
        // Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7")
        const primaryLang = langFromHeader.split(',')[0].split('-')[0].toLowerCase();
        if (config_1.config.app.supportedLanguages.includes(primaryLang)) {
            language = primaryLang;
        }
    }
    req.language = language;
    next();
};
exports.i18nMiddleware = i18nMiddleware;
//# sourceMappingURL=i18n.js.map