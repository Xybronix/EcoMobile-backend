interface CameroonArea {
    key: string;
    name: string;
    location: {
        lat: number;
        lng: number;
    };
    city: string;
    country: string;
}
declare class GooglePlacesService {
    private client;
    private apiKey;
    private defaultCameroonAreas;
    constructor(apiKey: string);
    searchPlaces(query: string, country?: string): Promise<CameroonArea[]>;
    getDefaultCameroonAreas(): CameroonArea[];
    reverseGeocode(lat: number, lng: number): Promise<string>;
    private extractCity;
    private extractCountry;
}
export default GooglePlacesService;
//# sourceMappingURL=GooglePlacesService.d.ts.map