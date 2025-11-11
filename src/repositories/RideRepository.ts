import { BaseRepository } from './BaseRepository';
import { Ride } from '../models/types';

export class RideRepository extends BaseRepository<Ride> {
  constructor() {
    super('rides');
  }

  async findByUserId(userId: string): Promise<Ride[]> {
    return this.findAll({ where: { userId }, sortBy: 'startTime', sortOrder: 'DESC' });
  }

  async findActiveRideByUserId(userId: string): Promise<Ride | null> {
    return this.findOne({ userId, status: 'in_progress' });
  }

  async findByBikeId(bikeId: string): Promise<Ride[]> {
    return this.findAll({ where: { bikeId }, sortBy: 'startTime', sortOrder: 'DESC' });
  }

  async findByStatus(status: Ride['status']): Promise<Ride[]> {
    return this.findAll({ where: { status } });
  }

  async findActive(): Promise<Ride[]> {
    return this.findByStatus('in_progress');
  }

  async completeRide(rideId: string, endLocation: any, distance: number, duration: number, cost: number): Promise<void> {
    const endLocationStr = JSON.stringify(endLocation);
    const sql = `UPDATE ${this.tableName} SET 
      endTime = ${this.getPlaceholder(1)}, 
      endLocation = ${this.getPlaceholder(2)}, 
      distance = ${this.getPlaceholder(3)}, 
      duration = ${this.getPlaceholder(4)}, 
      cost = ${this.getPlaceholder(5)}, 
      status = ${this.getPlaceholder(6)}, 
      updatedAt = ${this.getPlaceholder(7)} 
      WHERE id = ${this.getPlaceholder(8)}`;
    
    await this.executeNonQuery(sql, [
      new Date(),
      endLocationStr,
      distance,
      duration,
      cost,
      'completed',
      new Date(),
      rideId
    ]);
  }

  async updatePaymentStatus(rideId: string, paymentStatus: Ride['paymentStatus']): Promise<void> {
    const sql = `UPDATE ${this.tableName} SET paymentStatus = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [paymentStatus, new Date(), rideId]);
  }

  async getUserRideStats(userId: string): Promise<{ totalRides: number; totalDistance: number; totalCost: number }> {
    const sql = `SELECT 
      COUNT(*) as totalRides, 
      COALESCE(SUM(distance), 0) as totalDistance, 
      COALESCE(SUM(cost), 0) as totalCost 
      FROM ${this.tableName} 
      WHERE userId = ${this.getPlaceholder(1)} AND status = 'completed'`;
    
    const result = await this.executeQuery(sql, [userId]);
    return result[0] || { totalRides: 0, totalDistance: 0, totalCost: 0 };
  }
}
