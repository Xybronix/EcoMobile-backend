"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
class GpsService {
    constructor(config) {
        this.config = config;
    }
    async makeJsonPRequest(cmd, data = [], field = '', callback = 'JsonPCallback') {
        const dataParam = data.length > 0 ? data.map(d => `N'${d}'`).join(',') : '';
        const url = `${this.config.baseUrl}/AppJson.asp?Cmd=${cmd}&Data=${dataParam}&Field=${field}&Callback=${callback}`;
        try {
            const response = await (0, node_fetch_1.default)(url);
            const text = await response.text();
            const jsonText = text.replace(new RegExp(`^${callback}\\(`), '').replace(/\);?$/, '');
            const result = JSON.parse(jsonText);
            if (result.m_isResultOk !== 1) {
                throw new Error('GPS API request failed');
            }
            return result;
        }
        catch (error) {
            console.error('GPS API Error:', error);
            throw new Error('Failed to communicate with GPS service');
        }
    }
    async login() {
        try {
            const response = await this.makeJsonPRequest('Proc_Login', [this.config.username, this.config.password], '', 'JsonP5');
            return response.m_isResultOk === 1;
        }
        catch (error) {
            console.error('GPS Login failed:', error);
            return false;
        }
    }
    async getDevices(username) {
        try {
            const response = await this.makeJsonPRequest('Proc_GetCar', [username], '', 'JsonP2');
            const devices = response.m_arrRecord.map(record => {
                const device = {};
                response.m_arrField.forEach((field, index) => {
                    device[field] = record[index];
                });
                return device;
            });
            return devices;
        }
        catch (error) {
            console.error('Failed to get GPS devices:', error);
            return [];
        }
    }
    async getLastPosition(deviceId) {
        try {
            const response = await this.makeJsonPRequest('Proc_GetLastPosition', [deviceId], '', 'JsonP4');
            if (response.m_arrRecord.length === 0) {
                return null;
            }
            const location = {};
            response.m_arrField.forEach((field, index) => {
                location[field] = response.m_arrRecord[0][index];
            });
            return location;
        }
        catch (error) {
            console.error('Failed to get last position:', error);
            return null;
        }
    }
    async getTrack(deviceId, startTime, endTime, limit = 1000) {
        try {
            const response = await this.makeJsonPRequest('Proc_GetTrack', [deviceId, startTime.toString(), endTime.toString(), limit.toString()], '', 'JsonP5');
            const locations = response.m_arrRecord.map(record => {
                const location = {};
                response.m_arrField.forEach((field, index) => {
                    location[field] = record[index];
                });
                return location;
            });
            return locations;
        }
        catch (error) {
            console.error('Failed to get track:', error);
            return [];
        }
    }
    async getMileage(deviceId, startTime, endTime) {
        try {
            const response = await this.makeJsonPRequest('Proc_GetMileage', [deviceId, startTime.toString(), endTime.toString()], '', 'JsonP5');
            if (response.m_arrRecord.length === 0) {
                return null;
            }
            const mileage = {};
            response.m_arrField.forEach((field, index) => {
                mileage[field] = response.m_arrRecord[0][index];
            });
            return {
                strTEID: mileage.strTEID,
                nStartMileage: parseInt(mileage.nStartMileage),
                nEndMileage: parseInt(mileage.nEndMileage),
                nMileage: parseInt(mileage.nMileage)
            };
        }
        catch (error) {
            console.error('Failed to get mileage:', error);
            return null;
        }
    }
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLng = (lng2 - lng1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    convertUtcToLocalTime(utcSeconds) {
        return new Date(utcSeconds * 1000);
    }
    parseBatteryLevel(nFuel) {
        return Math.max(0, Math.min(100, nFuel));
    }
    parseDeviceStatus(nTEState) {
        if (nTEState & 0x80) {
            return 'unavailable';
        }
        if (nTEState & 0x04) {
            return 'maintenance';
        }
        return 'available';
    }
}
exports.default = GpsService;
//# sourceMappingURL=GpsService.js.map