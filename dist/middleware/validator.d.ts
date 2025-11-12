import { Request, Response, NextFunction } from 'express';
export declare const validate: (req: Request & {
    language?: "fr" | "en";
}, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const loginValidator: import("express-validator").ValidationChain[];
export declare const registerValidator: import("express-validator").ValidationChain[];
export declare const updateProfileValidator: import("express-validator").ValidationChain[];
export declare const changePasswordValidator: import("express-validator").ValidationChain[];
export declare const createBikeValidator: import("express-validator").ValidationChain[];
export declare const startRideValidator: import("express-validator").ValidationChain[];
export declare const endRideValidator: import("express-validator").ValidationChain[];
export declare const createIncidentValidator: import("express-validator").ValidationChain[];
export declare const paginationValidator: import("express-validator").ValidationChain[];
export declare const idValidator: import("express-validator").ValidationChain[];
//# sourceMappingURL=validator.d.ts.map