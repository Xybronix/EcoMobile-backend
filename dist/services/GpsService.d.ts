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
declare class GpsService {
    private config;
    constructor(config: GpsConfig);
    private makeJsonPRequest;
    login(): Promise<boolean>;
    getDevices(username: string): Promise<GpsDevice[]>;
    getLastPosition(deviceId: string): Promise<GpsLocation | null>;
    getTrack(deviceId: string, startTime: number, endTime: number, limit?: number): Promise<GpsLocation[]>;
    getMileage(deviceId: string, startTime: number, endTime: number): Promise<{
        strTEID: string;
        nStartMileage: number;
        nEndMileage: number;
        nMileage: number;
    } | null>;
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
    convertUtcToLocalTime(utcSeconds: number): Date;
    parseBatteryLevel(nFuel: number): number;
    parseDeviceStatus(nTEState: number): 'available' | 'in_use' | 'maintenance' | 'unavailable';
}
export default GpsService;
//# sourceMappingURL=GpsService.d.ts.map