// services/GooglePlacesService.ts
import { Client, PlaceData, AddressComponent } from '@googlemaps/google-maps-services-js';

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

class GooglePlacesService {
  private client: Client;
  private apiKey: string;

  // Quartiers prédéfinis du Cameroun
  private defaultCameroonAreas: CameroonArea[] = [
    // Douala
    { key: 'douala_akwa', name: 'Akwa', location: { lat: 4.0511, lng: 9.7679 }, city: 'Douala', country: 'CM' },
    { key: 'douala_bonanjo', name: 'Bonanjo', location: { lat: 4.0514, lng: 9.7653 }, city: 'Douala', country: 'CM' },
    { key: 'douala_bassa', name: 'Bassa', location: { lat: 4.0405, lng: 9.7099 }, city: 'Douala', country: 'CM' },
    { key: 'douala_bonaberi', name: 'Bonabéri', location: { lat: 4.0761, lng: 9.6794 }, city: 'Douala', country: 'CM' },
    { key: 'douala_deido', name: 'Deido', location: { lat: 4.0667, lng: 9.7333 }, city: 'Douala', country: 'CM' },
    { key: 'douala_new_bell', name: 'New Bell', location: { lat: 4.0500, lng: 9.7167 }, city: 'Douala', country: 'CM' },
    { key: 'douala_pk', name: 'PK 8-14', location: { lat: 4.1167, lng: 9.7333 }, city: 'Douala', country: 'CM' },
    { key: 'douala_makepe', name: 'Makepe', location: { lat: 4.0833, lng: 9.7500 }, city: 'Douala', country: 'CM' },
    { key: 'douala_logbaba', name: 'Logbaba', location: { lat: 4.1000, lng: 9.7667 }, city: 'Douala', country: 'CM' },
    { key: 'douala_beedi', name: 'Bépanda', location: { lat: 4.0333, lng: 9.7000 }, city: 'Douala', country: 'CM' },

    // Yaoundé
    { key: 'yaounde_centre', name: 'Centre Administratif', location: { lat: 3.8480, lng: 11.5021 }, city: 'Yaoundé', country: 'CM' },
    { key: 'yaounde_bastos', name: 'Bastos', location: { lat: 3.8833, lng: 11.5167 }, city: 'Yaoundé', country: 'CM' },
    { key: 'yaounde_mfoundi', name: 'Mfoundi', location: { lat: 3.8667, lng: 11.5167 }, city: 'Yaoundé', country: 'CM' },
    { key: 'yaounde_nlongkak', name: 'Nlongkak', location: { lat: 3.8833, lng: 11.4833 }, city: 'Yaoundé', country: 'CM' },
    { key: 'yaounde_mvog_ada', name: 'Mvog-Ada', location: { lat: 3.8333, lng: 11.5000 }, city: 'Yaoundé', country: 'CM' },
    { key: 'yaounde_essos', name: 'Essos', location: { lat: 3.8500, lng: 11.5333 }, city: 'Yaoundé', country: 'CM' },
    { key: 'yaounde_emombo', name: 'Emombo', location: { lat: 3.8167, lng: 11.4833 }, city: 'Yaoundé', country: 'CM' },
    { key: 'yaounde_mendong', name: 'Mendong', location: { lat: 3.8000, lng: 11.4833 }, city: 'Yaoundé', country: 'CM' },
    { key: 'yaounde_mvan', name: 'Mvan', location: { lat: 3.8667, lng: 11.4667 }, city: 'Yaoundé', country: 'CM' },
    { key: 'yaounde_odza', name: 'Odza', location: { lat: 3.8667, lng: 11.5500 }, city: 'Yaoundé', country: 'CM' },
  ];

  constructor(apiKey: string) {
    this.client = new Client({});
    this.apiKey = apiKey;
  }

  async searchPlaces(query: string, country: string = 'CM'): Promise<CameroonArea[]> {
    try {
      // Si la recherche est vide, retourner les quartiers par défaut du Cameroun
      if (!query.trim()) {
        return this.getDefaultCameroonAreas();
      }

      // Rechercher d'abord dans les quartiers prédéfinis du Cameroun
      const localResults = this.defaultCameroonAreas.filter(area =>
        area.name.toLowerCase().includes(query.toLowerCase()) ||
        area.city.toLowerCase().includes(query.toLowerCase())
      );

      // Si on trouve des résultats locaux pour le Cameroun, les prioriser
      if (localResults.length > 0 && country === 'CM') {
        return localResults;
      }

      // Sinon, faire une recherche Google Places
      const response = await this.client.textSearch({
        params: {
          query: `${query} ${country === 'CM' ? 'Cameroon' : ''}`,
          key: this.apiKey,
        },
      });

      const places: CameroonArea[] = response.data.results
        .filter((place): place is PlaceData => 
          Boolean(place.place_id && place.name && place.geometry?.location)
        )
        .map((place: PlaceData) => ({
          key: `google_${place.place_id}`,
          name: place.name || 'Unknown',
          location: {
            lat: place.geometry!.location.lat,
            lng: place.geometry!.location.lng,
          },
          city: this.extractCity(place),
          country: this.extractCountry(place),
        }));

      // Combiner les résultats locaux et Google, en priorisant les résultats camerounais
      const cameroonResults = places.filter(p => p.country === 'CM');
      const otherResults = places.filter(p => p.country !== 'CM');

      return [...localResults, ...cameroonResults, ...otherResults];

    } catch (error) {
      console.error('Error searching places:', error);
      return this.defaultCameroonAreas.filter(area =>
        area.name.toLowerCase().includes(query.toLowerCase()) ||
        area.city.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  getDefaultCameroonAreas(): CameroonArea[] {
    return this.defaultCameroonAreas;
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.apiKey,
        },
      });

      if (response.data.results.length > 0) {
        return response.data.results[0].formatted_address || '';
      }
      return '';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return '';
    }
  }

  private extractCity(place: PlaceData): string {
    if (!place.address_components) return '';
    
    const cityComponent = place.address_components.find((component: AddressComponent) => {
      const types = component.types as string[];
      return types.includes('locality') || types.includes('administrative_area_level_2');
    });
    
    return cityComponent?.long_name || '';
  }

  private extractCountry(place: PlaceData): string {
    if (!place.address_components) return '';
    
    const countryComponent = place.address_components.find((component: AddressComponent) => {
      const types = component.types as string[];
      return types.includes('country');
    });
    
    return countryComponent?.short_name || '';
  }
}

export default GooglePlacesService;