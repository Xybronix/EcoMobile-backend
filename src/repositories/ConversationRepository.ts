import { BaseRepository } from './BaseRepository';
import { Conversation } from '../models/types';

export class ConversationRepository extends BaseRepository<Conversation> {
  constructor() {
    super('conversations');
  }

  async findByUserId(userId: string): Promise<Conversation[]> {
    return this.findAll({ where: { userId }, sortBy: 'lastMessageAt', sortOrder: 'DESC' });
  }

  async updateLastMessage(conversationId: string): Promise<void> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const sql = `UPDATE ${quotedTableName} SET ${this.quoteIdentifier('lastMessageAt')} = ${this.getPlaceholder(1)}, ${this.quoteIdentifier('updatedAt')} = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [new Date(), new Date(), conversationId]);
  }
}
