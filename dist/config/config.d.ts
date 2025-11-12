export declare const config: {
    readonly env: string;
    readonly port: number;
    readonly apiVersion: string;
    readonly database: {
        readonly type: "mysql" | "postgres" | "sqlite" | "mongodb" | "cassandra";
        readonly mysql: {
            readonly host: string;
            readonly port: number;
            readonly user: string;
            readonly password: string;
            readonly database: string;
        };
        readonly postgres: {
            readonly host: string;
            readonly port: number;
            readonly user: string;
            readonly password: string;
            readonly database: string;
        };
        readonly sqlite: {
            readonly path: string;
        };
        readonly mongodb: {
            readonly uri: string;
        };
        readonly cassandra: {
            readonly contactPoints: string;
            readonly keyspace: string;
            readonly localDataCenter: string;
        };
    };
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
        readonly refreshSecret: string;
        readonly refreshExpiresIn: string;
    };
    readonly email: {
        readonly host: string;
        readonly port: number;
        readonly secure: boolean;
        readonly user: string;
        readonly password: string;
        readonly from: string;
        readonly fromName: string;
    };
    readonly frontendUrl: string;
    readonly app: {
        readonly frontendUrl: string;
        readonly defaultLanguage: "fr" | "en";
        readonly supportedLanguages: string[];
    };
    readonly upload: {
        readonly maxFileSize: number;
        readonly uploadDir: string;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly logging: {
        readonly level: string;
        readonly dir: string;
    };
    readonly coolpay: {
        readonly apiUrl: string;
        readonly apiKey: string;
        readonly merchantId: string;
        readonly secretKey: string;
        readonly feePercentage: number;
        readonly orangeFeePercentage: number;
        readonly totalFeePercentage: number;
    };
    readonly cors: {
        readonly origin: string[];
    };
};
//# sourceMappingURL=config.d.ts.map