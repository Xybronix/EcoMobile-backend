interface Translation {
    fr: string;
    en: string;
}
interface Translations {
    [key: string]: Translation;
}
export declare const translations: Translations;
export declare function translate(key: string, lang?: 'fr' | 'en'): string;
export declare function t(key: string, language?: string, params?: Record<string, any>): string;
export {};
//# sourceMappingURL=index.d.ts.map