import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
export declare const errorHandler: (err: Error | AppError, req: Request & {
    language?: "fr" | "en";
}, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request & {
    language?: "fr" | "en";
}, res: Response) => void;
//# sourceMappingURL=errorHandler.d.ts.map