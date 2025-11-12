"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BikeRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class BikeRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('bikes');
    }
    async findByStatus(status) {
        return this.findAll({ where: { status } });
    }
    async findAvailableBikes() {
        return this.findAll({ where: { status: 'available' } });
    }
    async findByQRCode(qrCode) {
        return this.findOne({ qrCode });
    }
    async findNearby(latitude, longitude, radiusKm = 5) {
        // Simple implementation - in production, use spatial indexes
        const allBikes = await this.findAll({ where: { status: 'available' } });
        return allBikes.filter(bike => {
            const distance = this.calculateDistance(latitude, longitude, bike.location.latitude, bike.location.longitude);
            return distance <= radiusKm;
        });
    }
    async updateStatus(bikeId, status) {
        const sql = `UPDATE ${this.tableName} SET status = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
        await this.executeNonQuery(sql, [status, new Date(), bikeId]);
    }
    async updateLocation(bikeId, latitude, longitude, address) {
        const location = JSON.stringify({ latitude, longitude, address });
        const sql = `UPDATE ${this.tableName} SET location = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
        await this.executeNonQuery(sql, [location, new Date(), bikeId]);
    }
    async updateBatteryLevel(bikeId, batteryLevel) {
        const sql = `UPDATE ${this.tableName} SET batteryLevel = ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
        await this.executeNonQuery(sql, [batteryLevel, new Date(), bikeId]);
    }
    async incrementRideStats(bikeId, distance) {
        const sql = `UPDATE ${this.tableName} SET totalRides = totalRides + 1, totalDistance = totalDistance + ${this.getPlaceholder(1)}, updatedAt = ${this.getPlaceholder(2)} WHERE id = ${this.getPlaceholder(3)}`;
        await this.executeNonQuery(sql, [distance, new Date(), bikeId]);
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
}
exports.BikeRepository = BikeRepository;
//# sourceMappingURL=BikeRepository.js.map