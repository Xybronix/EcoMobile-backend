import { BaseRepository } from './BaseRepository';
import { Incident } from '../models/types';

export class IncidentRepository extends BaseRepository<Incident> {
  constructor() {
    super('incidents');
  }

  async findByUserId(userId: string): Promise<Incident[]> {
    return this.findAll({ where: { userId }, sortBy: 'createdAt', sortOrder: 'DESC' });
  }

  async findByBikeId(bikeId: string): Promise<Incident[]> {
    return this.findAll({ where: { bikeId }, sortBy: 'createdAt', sortOrder: 'DESC' });
  }

  async findByStatus(status: Incident['status']): Promise<Incident[]> {
    return this.findAll({ where: { status } });
  }
}
