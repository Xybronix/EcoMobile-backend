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
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const sql = `UPDATE ${quotedTableName} SET 
      ${this.quoteIdentifier('endTime')} = ${this.getPlaceholder(1)}, 
      ${this.quoteIdentifier('endLocation')} = ${this.getPlaceholder(2)}, 
      ${this.quoteIdentifier('distance')} = ${this.getPlaceholder(3)}, 
      ${this.quoteIdentifier('duration')} = ${this.getPlaceholder(4)}, 
      ${this.quoteIdentifier('cost')} = ${this.getPlaceholder(5)}, 
      ${this.quoteIdentifier('status')} = ${this.getPlaceholder(6)}, 
      ${this.quoteIdentifier('updatedAt')} = ${this.getPlaceholder(7)} 
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
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const sql = `UPDATE ${quotedTableName} SET ${this.quoteIdentifier('paymentStatus')} = ${this.getPlaceholder(1)}, ${this.quoteIdentifier('updatedAt')} = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [paymentStatus, new Date(), rideId]);
  }

  async getUserRideStats(userId: string): Promise<{ totalRides: number; totalDistance: number; totalCost: number }> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const sql = `SELECT 
      COUNT(*) as ${this.quoteIdentifier('totalRides')}, 
      COALESCE(SUM(${this.quoteIdentifier('distance')}), 0) as ${this.quoteIdentifier('totalDistance')}, 
      COALESCE(SUM(${this.quoteIdentifier('cost')}), 0) as ${this.quoteIdentifier('totalCost')} 
      FROM ${quotedTableName} 
      WHERE ${this.quoteIdentifier('userId')} = ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('status')} = 'completed'`;
    
    const result = await this.executeQuery(sql, [userId]);
    return result[0] || { totalRides: 0, totalDistance: 0, totalCost: 0 };
  }
}
