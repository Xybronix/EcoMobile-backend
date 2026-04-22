import { BaseRepository } from './BaseRepository';
import { Bike } from '../models/types';

export class BikeRepository extends BaseRepository<Bike> {
  constructor() {
    super('bikes');
  }

  async findByStatus(status: string): Promise<Bike[]> {
    return this.findAll({ where: { status } });
  }

  async findAvailableBikes(): Promise<Bike[]> {
    return this.findAll({ where: { status: 'available' } });
  }

  async findByQRCode(qrCode: string): Promise<Bike | null> {
    return this.findOne({ qrCode });
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 5): Promise<Bike[]> {
    // Simple implementation - in production, use spatial indexes
    const allBikes = await this.findAll({ where: { status: 'available' } });
    
    return allBikes.filter(bike => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        bike.location.latitude,
        bike.location.longitude
      );
      return distance <= radiusKm;
    });
  }

  async updateStatus(bikeId: string, status: Bike['status']): Promise<void> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const sql = `UPDATE ${quotedTableName} SET ${this.quoteIdentifier('status')} = ${this.getPlaceholder(1)}, ${this.quoteIdentifier('updatedAt')} = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [status, new Date(), bikeId]);
  }

  async updateLocation(bikeId: string, latitude: number, longitude: number, address?: string): Promise<void> {
    const location = JSON.stringify({ latitude, longitude, address });
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const sql = `UPDATE ${quotedTableName} SET ${this.quoteIdentifier('location')} = ${this.getPlaceholder(1)}, ${this.quoteIdentifier('updatedAt')} = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [location, new Date(), bikeId]);
  }

  async updateBatteryLevel(bikeId: string, batteryLevel: number): Promise<void> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const sql = `UPDATE ${quotedTableName} SET ${this.quoteIdentifier('batteryLevel')} = ${this.getPlaceholder(1)}, ${this.quoteIdentifier('updatedAt')} = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [batteryLevel, new Date(), bikeId]);
  }

  async incrementRideStats(bikeId: string, distance: number): Promise<void> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const sql = `UPDATE ${quotedTableName} SET ${this.quoteIdentifier('totalRides')} = ${this.quoteIdentifier('totalRides')} + 1, ${this.quoteIdentifier('totalDistance')} = ${this.quoteIdentifier('totalDistance')} + ${this.getPlaceholder(1)}, ${this.quoteIdentifier('updatedAt')} = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
    await this.executeNonQuery(sql, [distance, new Date(), bikeId]);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
