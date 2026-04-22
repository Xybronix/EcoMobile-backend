import { BaseRepository } from './BaseRepository';
import { ActivityLog } from '../models/types';

export class ActivityLogRepository extends BaseRepository<ActivityLog> {
  constructor() {
    super('activity_logs');
  }

  async findByUserId(userId: string): Promise<ActivityLog[]> {
    return this.findAll({ where: { userId }, sortBy: 'createdAt', sortOrder: 'DESC' });
  }

  async findByEntity(entity: string, entityId: string): Promise<ActivityLog[]> {
    return this.findAll({ where: { entity, entityId }, sortBy: 'createdAt', sortOrder: 'DESC' });
  }
}
