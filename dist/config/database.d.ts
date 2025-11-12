export interface DatabaseConnection {
    type: string;
    connection: any;
    query: (sql: string, params?: any[]) => Promise<any>;
    execute: (sql: string, params?: any[]) => Promise<any>;
    close: () => Promise<void>;
}
declare class DatabaseManager {
    private static instance;
    private connection;
    static getInstance(): DatabaseManager;
    connect(): Promise<DatabaseConnection>;
    private connectMySQL;
    private connectPostgreSQL;
    private connectSQLite;
    private connectMongoDB;
    private connectCassandra;
    getConnection(): DatabaseConnection;
    disconnect(): Promise<void>;
}
export declare const dbManager: DatabaseManager;
export declare const getDb: () => DatabaseConnection;
export {};
//# sourceMappingURL=database.d.ts.map