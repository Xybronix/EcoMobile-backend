const fetch = globalThis.fetch;

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
  private isAuthenticated: boolean = false;
  private authenticationAttempts: number = 0;
  private readonly maxAuthAttempts: number = 3;

  constructor(config: GpsConfig) {
    this.config = config;
  }

  private async makeJsonPRequest<T>(
    cmd: string,
    data: string[] = [],
    field: string = '',
    callback: string = 'JsonPCallback'
  ): Promise<JsonPResponse<T>> {
    // Assurer l'authentification avant chaque requête
    if (!this.isAuthenticated && this.authenticationAttempts < this.maxAuthAttempts) {
      await this.login();
    }

    const dataParam = data.length > 0 ? data.map(d => `N'${d}'`).join(',') : '';
    const url = `${this.config.baseUrl}/AppJson.asp?Cmd=${cmd}&Data=${dataParam}&Field=${field}&Callback=${callback}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      let response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'EcoMobile-Backend/1.0'
          }
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      
      // Nettoyer la réponse JsonP
      const jsonText = text.replace(new RegExp(`^${callback}\\(`), '').replace(/\);?\s*$/, '');
      const result = JSON.parse(jsonText);
      
      if (result.m_isResultOk !== 1) {
        throw new Error(`GPS API error: ${result.m_isResultOk}`);
      }
      
      return result;
    } catch (error) {
      console.error('GPS API Error:', error);
      throw new Error('Failed to communicate with GPS service');
    }
  }

  async login(): Promise<boolean> {
    try {
      this.authenticationAttempts++;
      
      const response = await this.makeJsonPRequest(
        'Proc_Login',
        [this.config.username, this.config.password],
        '',
        'JsonP5'
      );
      
      this.isAuthenticated = response.m_isResultOk === 1;
      
      if (this.isAuthenticated) {
        this.authenticationAttempts = 0;
      }
      
      return this.isAuthenticated;
    } catch (error) {
      console.error('GPS Login failed:', error);
      this.isAuthenticated = false;
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
        const value = response.m_arrRecord[0][index];
        
        // Conversion des types selon les champs
        switch (field) {
          case 'nTime':
          case 'nDirection':
          case 'nSpeed':
          case 'nGSMSignal':
          case 'nGPSSignal':
          case 'nFuel':
          case 'nMileage':
          case 'nTemp':
          case 'nCarState':
          case 'nTEState':
          case 'nAlarmState':
            location[field] = parseInt(value) || 0;
            break;
          case 'dbLon':
          case 'dbLat':
            location[field] = parseFloat(value) || 0;
            break;
          default:
            location[field] = value;
        }
      });

      return location as GpsLocation;
    } catch (error) {
      console.error(`Failed to get last position for device ${deviceId}:`, error);
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
          const value = record[index];
          
          // Conversion des types
          switch (field) {
            case 'nTime':
            case 'nDirection':
            case 'nSpeed':
            case 'nGSMSignal':
            case 'nGPSSignal':
            case 'nFuel':
            case 'nMileage':
            case 'nTemp':
            case 'nCarState':
            case 'nTEState':
            case 'nAlarmState':
              location[field] = parseInt(value) || 0;
              break;
            case 'dbLon':
            case 'dbLat':
              location[field] = parseFloat(value) || 0;
              break;
            default:
              location[field] = value;
          }
        });
        return location as GpsLocation;
      });

      return locations;
    } catch (error) {
      console.error(`Failed to get track for device ${deviceId}:`, error);
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
        nStartMileage: parseInt(mileage.nStartMileage) || 0,
        nEndMileage: parseInt(mileage.nEndMileage) || 0,
        nMileage: parseInt(mileage.nMileage) || 0
      };
    } catch (error) {
      console.error(`Failed to get mileage for device ${deviceId}:`, error);
      return null;
    }
  }

  // Utility methods
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
    // Adapter selon votre dispositif GPS
    // Si nFuel est déjà en pourcentage (0-100)
    if (nFuel >= 0 && nFuel <= 100) {
      return Math.max(0, Math.min(100, Math.round(nFuel)));
    }
    
    return 50;
  }

  parseGpsSignal(nGPSSignal: number): number {
    return Math.max(0, Math.min(100, nGPSSignal));
  }

  parseGsmSignal(nGSMSignal: number): number {
    return Math.max(0, Math.min(100, nGSMSignal));
  }

  parseDeviceStatus(nTEState: number): 'online' | 'offline' | 'maintenance' {
    // Analyser les bits selon la documentation
    if (nTEState & 0x80) { 
      return 'offline';
    }
    if (nTEState & 0x04) { 
      return 'maintenance';
    }
    return 'online';
  }

  parseCarState(nCarState: number): {
    engineOn: boolean;
    doorOpen: boolean;
    shock: boolean;
    armed: boolean;
  } {
    return {
      engineOn: !!(nCarState & 0x80),      // Bit 7
      doorOpen: !!(nCarState & 0x20),      // Bit 5
      shock: !!(nCarState & 0x08),         // Bit 3
      armed: !(nCarState & 0x01)           // Bit 0 (inverted)
    };
  }

  /**
   * Vérifier si un dispositif est en ligne
   */
  async isDeviceOnline(deviceId: string): Promise<boolean> {
    try {
      const position = await this.getLastPosition(deviceId);
      if (!position) return false;

      // Vérifier que la position est récente (moins de 30 minutes)
      const lastUpdate = this.convertUtcToLocalTime(position.nTime);
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      // Et que le statut du dispositif indique qu'il est en ligne
      const deviceStatus = this.parseDeviceStatus(position.nTEState);
      
      return lastUpdate > thirtyMinutesAgo && deviceStatus === 'online';
    } catch (error) {
      console.error(`Error checking device ${deviceId} online status:`, error);
      return false;
    }
  }
}

export default GpsService;