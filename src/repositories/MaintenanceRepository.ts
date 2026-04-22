import { BaseRepository } from './BaseRepository';
import { Maintenance } from '../models/types';

export class MaintenanceRepository extends BaseRepository<Maintenance> {
  constructor() {
    super('maintenance');
  }

  async findByBikeId(bikeId: string): Promise<Maintenance[]> {
    return this.findAll({ where: { bikeId }, sortBy: 'scheduledDate', sortOrder: 'DESC' });
  }

  async findByStatus(status: Maintenance['status']): Promise<Maintenance[]> {
    return this.findAll({ where: { status } });
  }
}
