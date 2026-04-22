import { BaseRepository } from './BaseRepository';
import { ChatMessage } from '../models/types';

export class ChatMessageRepository extends BaseRepository<ChatMessage> {
  constructor() {
    super('chat_messages');
  }

  async findByConversationId(conversationId: string): Promise<ChatMessage[]> {
    return this.findAll({ where: { conversationId }, sortBy: 'createdAt', sortOrder: 'ASC' });
  }

  async markAsRead(messageId: string): Promise<void> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const sql = `UPDATE ${quotedTableName} SET ${this.quoteIdentifier('read')} = ${this.getPlaceholder(1)}, ${this.quoteIdentifier('updatedAt')} = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [true, new Date(), messageId]);
  }
}
