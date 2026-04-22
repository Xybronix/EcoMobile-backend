import { BaseRepository } from './BaseRepository';
import { Review } from '../models/types';

export class ReviewRepository extends BaseRepository<Review> {
  constructor() {
    super('reviews');
  }

  async findByBikeId(bikeId: string): Promise<Review[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('bikeId')} = ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('status')} = 'approved'
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
    `;
    const results = await this.executeQuery(query, [bikeId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findByUserId(userId: string): Promise<Review[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('userId')} = ${this.getPlaceholder(1)}
      ORDER BY ${this.quoteIdentifier('createdAt')} DESC
    `;
    const results = await this.executeQuery(query, [userId]);
    return results.map((row: any) => this.mapToModel(row));
  }

  async findPending(): Promise<Review[]> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT * FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('status')} = 'pending'
      ORDER BY ${this.quoteIdentifier('createdAt')} ASC
    `;
    const results = await this.executeQuery(query);
    return results.map((row: any) => this.mapToModel(row));
  }

  async getAverageRatingByBike(bikeId: string): Promise<number> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const query = `
      SELECT AVG(${this.quoteIdentifier('rating')}) as avgRating FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('bikeId')} = ${this.getPlaceholder(1)} AND ${this.quoteIdentifier('status')} = 'approved'
    `;
    const results = await this.executeQuery(query, [bikeId]);
    return results[0]?.avgRating || 0;
  }

  async getOverallStatistics(): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const quotedTableName = this.quoteIdentifier(this.tableName);
    const avgQuery = `
      SELECT AVG(${this.quoteIdentifier('rating')}) as avgRating, COUNT(*) as total
      FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('status')} = 'approved'
    `;
    const avgResults = await this.executeQuery(avgQuery);

    const distQuery = `
      SELECT ${this.quoteIdentifier('rating')}, COUNT(*) as count
      FROM ${quotedTableName}
      WHERE ${this.quoteIdentifier('status')} = 'approved'
      GROUP BY ${this.quoteIdentifier('rating')}
    `;
    const distResults = await this.executeQuery(distQuery);

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
