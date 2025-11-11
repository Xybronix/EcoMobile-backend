import { BaseRepository } from './BaseRepository';
import { Review } from '../models/types';

export class ReviewRepository extends BaseRepository<Review> {
  constructor() {
    super('reviews');
  }

  async findByBikeId(bikeId: string): Promise<Review[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE bikeId = ? AND status = 'approved'
      ORDER BY createdAt DESC
    `;
    const results = await this.db.query(query, [bikeId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByUserId(userId: string): Promise<Review[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE userId = ?
      ORDER BY createdAt DESC
    `;
    const results = await this.db.query(query, [userId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findPending(): Promise<Review[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'pending'
      ORDER BY createdAt ASC
    `;
    const results = await this.db.query(query);
    return results.map((row: any) => this.mapToModel(row));
  }

  async getAverageRatingByBike(bikeId: string): Promise<number> {
    const query = `
      SELECT AVG(rating) as avgRating FROM ${this.tableName}
      WHERE bikeId = ? AND status = 'approved'
    `;
    const results = await this.db.query(query, [bikeId]);
    return results[0]?.avgRating || 0;
  }

  async getOverallStatistics(): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const avgQuery = `
      SELECT AVG(rating) as avgRating, COUNT(*) as total
      FROM ${this.tableName}
      WHERE status = 'approved'
    `;
    const avgResults = await this.db.query(avgQuery);

    const distQuery = `
      SELECT rating, COUNT(*) as count
      FROM ${this.tableName}
      WHERE status = 'approved'
      GROUP BY rating
    `;
    const distResults = await this.db.query(distQuery);

    const ratingDistribution: { [key: number]: number } = {};
    distResults.forEach((row: any) => {
      ratingDistribution[row.rating] = row.count;
    });

    return {
      averageRating: avgResults[0]?.avgRating || 0,
      totalReviews: avgResults[0]?.total || 0,
      ratingDistribution
    };
  }

  protected mapToModel(row: any): Review {
    return {
      ...row,
      respondedAt: row.respondedAt ? new Date(row.respondedAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}
