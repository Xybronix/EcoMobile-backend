import { BaseRepository } from './BaseRepository';
import { User } from '../models/types';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findByRole(role: string): Promise<User[]> {
    return this.findAll({ where: { role } });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET password = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [hashedPassword, new Date(), userId]);
  }

  async update(userId: string, data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  }): Promise<User> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) {
      updateFields.push(`email = ${this.getPlaceholder(paramIndex++)}`);
      values.push(data.email);
    }

    if (data.firstName !== undefined) {
      updateFields.push(`firstName = ${this.getPlaceholder(paramIndex++)}`);
      values.push(data.firstName);
    }

    if (data.lastName !== undefined) {
      updateFields.push(`lastName = ${this.getPlaceholder(paramIndex++)}`);
      values.push(data.lastName);
    }

    if (data.phone !== undefined) {
      updateFields.push(`phone = ${this.getPlaceholder(paramIndex++)}`);
      values.push(data.phone);
    }

    if (data.address !== undefined) {
      updateFields.push(`address = ${this.getPlaceholder(paramIndex++)}`);
      values.push(data.address);
    }

    updateFields.push(`updatedAt = ${this.getPlaceholder(paramIndex++)}`);
    values.push(new Date());

    values.push(userId);

    // Utiliser UPDATE séparé de SELECT pour MySQL
    const updateSql = `UPDATE ${this.tableName} SET ${updateFields.join(', ')} WHERE id = ${this.getPlaceholder(paramIndex)}`;
    await this.executeNonQuery(updateSql, values);

    // Récupérer les données mises à jour
    const selectSql = `SELECT * FROM ${this.tableName} WHERE id = ${this.getPlaceholder(1)}`;
    const result = await this.executeQuery(selectSql, [userId]);
    
    if (!result || result.length === 0) {
      throw new Error('Utilisateur non trouvé après mise à jour');
    }
    
    return result[0];
  }

  async verifyEmail(userId: string): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET emailVerified = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [true, new Date(), userId]);
  }

  async updateStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET status = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [status, new Date(), userId]);
  }
}
