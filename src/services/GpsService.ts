import fetch from 'node-fetch';

interface GpsConfig {
  baseUrl: string;
  username: string;
  password: string;
}

interface GpsLocation {
  nID: string;
  strTEID: string;
  nTime: number;
  dbLon: number;
  dbLat: number;
  nDirection: number;
  nSpeed: number;
  nGSMSignal: number;
  nGPSSignal: number;
  nFuel: number;
  nMileage: number;
  nTemp: number;
  nCarState: number;
  nTEState: number;
  nAlarmState: number;
  strOther: string;
}

interface GpsDevice {
  nID: string;
  strTEID: string;
  strCarNum: string;
  strTESim: string;
  nTEType: string;
  strGroupName: string;
  strOwnerName: string;
  strOwnerTel: string;
  strOwnerAddress: string;
  strRemark: string;
  strIconID: string;
  nFuelBoxSize: string;
  nMileageInit: string;
  nInterval: string;
  nOverSpeed: string;
  nSMSNoticeState: string;
  strSMSNoticeTel1: string;
  strSMSNoticeTel2: string;
  strSMSNoticeTel3: string;
  strNoticeEmail1: string;
  strNoticeEmail2: string;
  strNoticeEmail3: string;
  strPassword: string;
  nCreateTime: string;
  nSwitchType: string;
  strInfo: string;
  strOpenID: string;
  strDeviceID: string;
  nLimitTime: string;
  strProvinceID: string;
  strCityID: string;
  strFactoryID: string;
  strDeviceModel: string;
  strPlateColorID: string;
  strPlateNum: string;
}

interface JsonPResponse<T> {
  m_isResultOk: number;
  m_arrField: string[];
  m_arrRecord: T[][];
}

class GpsService {
  private config: GpsConfig;

  constructor(config: GpsConfig) {
    this.config = config;
  }

  private async makeJsonPRequest<T>(
    cmd: string,
    data: string[] = [],
    field: string = '',
    callback: string = 'JsonPCallback'
  ): Promise<JsonPResponse<T>> {
    const dataParam = data.length > 0 ? data.map(d => `N'${d}'`).join(',') : '';
    const url = `${this.config.baseUrl}/AppJson.asp?Cmd=${cmd}&Data=${dataParam}&Field=${field}&Callback=${callback}`;

    try {
      const response = await fetch(url);
      const text = await response.text();
      
      const jsonText = text.replace(new RegExp(`^${callback}\\(`), '').replace(/\);?$/, '');
      const result = JSON.parse(jsonText);
      
      if (result.m_isResultOk !== 1) {
        throw new Error('GPS API request failed');
      }
      
      return result;
    } catch (error) {
      console.error('GPS API Error:', error);
      throw new Error('Failed to communicate with GPS service');
    }
  }

  async login(): Promise<boolean> {
    try {
      const response = await this.makeJsonPRequest(
        'Proc_Login',
        [this.config.username, this.config.password],
        '',
        'JsonP5'
      );
      
      return response.m_isResultOk === 1;
    } catch (error) {
      console.error('GPS Login failed:', error);
      return false;
    }
  }

  async getDevices(username: string): Promise<GpsDevice[]> {
    try {
      const response = await this.makeJsonPRequest<string>(
        'Proc_GetCar',
        [username],
        '',
        'JsonP2'
      );

      const devices: GpsDevice[] = response.m_arrRecord.map(record => {
        const device: any = {};
        response.m_arrField.forEach((field, index) => {
          device[field] = record[index];
        });
        return device as GpsDevice;
      });

      return devices;
    } catch (error) {
      console.error('Failed to get GPS devices:', error);
      return [];
    }
  }

  async getLastPosition(deviceId: string): Promise<GpsLocation | null> {
    try {
      const response = await this.makeJsonPRequest<string>(
        'Proc_GetLastPosition',
        [deviceId],
        '',
        'JsonP4'
      );

      if (response.m_arrRecord.length === 0) {
        return null;
      }

      const location: any = {};
      response.m_arrField.forEach((field, index) => {
        location[field] = response.m_arrRecord[0][index];
      });

      return location as GpsLocation;
    } catch (error) {
      console.error('Failed to get last position:', error);
      return null;
    }
  }

  async getTrack(deviceId: string, startTime: number, endTime: number, limit: number = 1000): Promise<GpsLocation[]> {
    try {
      const response = await this.makeJsonPRequest<string>(
        'Proc_GetTrack',
        [deviceId, startTime.toString(), endTime.toString(), limit.toString()],
        '',
        'JsonP5'
      );

      const locations: GpsLocation[] = response.m_arrRecord.map(record => {
        const location: any = {};
        response.m_arrField.forEach((field, index) => {
          location[field] = record[index];
        });
        return location as GpsLocation;
      });

      return locations;
    } catch (error) {
      console.error('Failed to get track:', error);
      return [];
    }
  }

  async getMileage(deviceId: string, startTime: number, endTime: number): Promise<{
    strTEID: string;
    nStartMileage: number;
    nEndMileage: number;
    nMileage: number;
  } | null> {
    try {
      const response = await this.makeJsonPRequest<string>(
        'Proc_GetMileage',
        [deviceId, startTime.toString(), endTime.toString()],
        '',
        'JsonP5'
      );

      if (response.m_arrRecord.length === 0) {
        return null;
      }

      const mileage: any = {};
      response.m_arrField.forEach((field, index) => {
        mileage[field] = response.m_arrRecord[0][index];
      });

      return {
        strTEID: mileage.strTEID,
        nStartMileage: parseInt(mileage.nStartMileage),
        nEndMileage: parseInt(mileage.nEndMileage),
        nMileage: parseInt(mileage.nMileage)
      };
    } catch (error) {
      console.error('Failed to get mileage:', error);
      return null;
    }
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  convertUtcToLocalTime(utcSeconds: number): Date {
    return new Date(utcSeconds * 1000);
  }

  parseBatteryLevel(nFuel: number): number {
    return Math.max(0, Math.min(100, nFuel));
  }

  parseDeviceStatus(nTEState: number): 'available' | 'in_use' | 'maintenance' | 'unavailable' {
    if (nTEState & 0x80) { 
      return 'unavailable';
    }
    if (nTEState & 0x04) { 
      return 'maintenance';
    }
    return 'available';
  }
}

export default GpsService;