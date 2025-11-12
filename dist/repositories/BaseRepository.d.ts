import { DatabaseConnection } from '../config/database';
export interface QueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    where?: Record<string, any>;
}
export declare abstract class BaseRepository<T> {
    protected tableName: string;
    protected db: DatabaseConnection;
    constructor(tableName: string);
    protected generateId(): string;
    protected buildWhereClause(where: Record<string, any>): {
        clause: string;
        params: any[];
    };
    protected getPlaceholder(index: number): string;
    protected executeQuery(sql: string, params?: any[]): Promise<any>;
    protected executeNonQuery(sql: string, params?: any[]): Promise<any>;
    findAll(options?: QueryOptions): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    findOne(where: Record<string, any>): Promise<T | null>;
    count(where?: Record<string, any>): Promise<number>;
    create(data: Partial<T>): Promise<T>;
    update(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
}
//# sourceMappingURL=BaseRepository.d.ts.map