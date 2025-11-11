import { getDb, DatabaseConnection } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  where?: Record<string, any>;
}

export abstract class BaseRepository<T> {
  protected tableName: string;
  protected db: DatabaseConnection;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = getDb();
  }

  protected generateId(): string {
    return uuidv4();
  }

  protected buildWhereClause(where: Record<string, any>): { clause: string; params: any[] } {
    if (!where || Object.keys(where).length === 0) {
      return { clause: '', params: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(where)) {
      if (value === null || value === undefined) {
        conditions.push(`${key} IS NULL`);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        for (const [operator, opValue] of Object.entries(value)) {
          switch (operator) {
            case 'gte':
              conditions.push(`${key} >= ${this.getPlaceholder(paramIndex++)}`);
              params.push(Number(opValue));
              break;
            case 'lte':
              conditions.push(`${key} <= ${this.getPlaceholder(paramIndex++)}`);
              params.push(Number(opValue));
              break;
            case 'gt':
              conditions.push(`${key} > ${this.getPlaceholder(paramIndex++)}`);
              params.push(Number(opValue));
              break;
            case 'lt':
              conditions.push(`${key} < ${this.getPlaceholder(paramIndex++)}`);
              params.push(Number(opValue));
              break;
            case 'contains':
              conditions.push(`${key} LIKE ${this.getPlaceholder(paramIndex++)}`);
              params.push(`%${opValue}%`);
              break;
          }
        }
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => this.getPlaceholder(paramIndex++)).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else {
        conditions.push(`${key} = ${this.getPlaceholder(paramIndex++)}`);
        if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
          params.push(Number(value));
        } else {
          params.push(value);
        }
      }
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }

  protected getPlaceholder(index: number): string {
    switch (this.db.type) {
      case 'postgres':
        return `$${index}`;
      case 'mysql':
      case 'sqlite':
        return '?';
      default:
        return '?';
    }
  }

  protected async executeQuery(sql: string, params?: any[]): Promise<any> {
    try {
      return await this.db.query(sql, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  protected async executeNonQuery(sql: string, params?: any[]): Promise<any> {
    try {
      return await this.db.execute(sql, params);
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  }

  async findAll(options: QueryOptions = {}): Promise<T[]> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', where } = options;
    const offset = (page - 1) * limit;

    const { clause, params } = this.buildWhereClause(where || {});

    let sql = `SELECT * FROM ${this.tableName} ${clause} ORDER BY ${sortBy} ${sortOrder}`;

    if (this.db.type === 'postgres') {
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    } else {
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const rows = await this.executeQuery(sql, params);
    return rows as T[];
  }

  async findById(id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ${this.getPlaceholder(1)}`;
    const rows = await this.executeQuery(sql, [id]);
    return rows.length > 0 ? (rows[0] as T) : null;
  }

  async findOne(where: Record<string, any>): Promise<T | null> {
    const { clause, params } = this.buildWhereClause(where);
    const sql = `SELECT * FROM ${this.tableName} ${clause} LIMIT 1`;
    const rows = await this.executeQuery(sql, params);
    return rows.length > 0 ? (rows[0] as T) : null;
  }

  async count(where?: Record<string, any>): Promise<number> {
    const { clause, params } = this.buildWhereClause(where || {});
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} ${clause}`;
    const rows = await this.executeQuery(sql, params);
    return rows[0].count;
  }

  async create(data: Partial<T>): Promise<T> {
    const id = this.generateId();
    const now = new Date();
    
    const fullData = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    const columns = Object.keys(fullData);
    const values = Object.values(fullData);
    const placeholders = columns.map((_, i) => this.getPlaceholder(i + 1)).join(', ');

    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    await this.executeNonQuery(sql, values);

    return fullData as T;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const columns = Object.keys(updateData);
    const values = Object.values(updateData);
    
    const setClause = columns.map((col, i) => `${col} = ${this.getPlaceholder(i + 1)}`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ${this.getPlaceholder(columns.length + 1)}`;
    
    await this.executeNonQuery(sql, [...values, id]);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ${this.getPlaceholder(1)}`;
    const result = await this.executeNonQuery(sql, [id]);
    return result.changes > 0 || result.affectedRows > 0;
  }
}
