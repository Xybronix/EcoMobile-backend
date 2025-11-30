const fetch = globalThis.fetch;

export class OpenStreetMapService {
  private baseUrl = 'https://nominatim.openstreetmap.org';
  private userAgent = 'EcoMobile-Backend/1.0';

  /**
   * Reverse geocoding - Convertir coordonnées en adresse
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const url = `${this.baseUrl}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=fr`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status}`);
      }

      const data: any = await response.json();
      
      if (data.error) {
        throw new Error(`OSM error: ${data.error}`);
      }

      // Construire une adresse lisible
      const address = data.address || {};
      const parts = [];

      // Priorité : quartier, commune, ville, région
      if (address.suburb || address.neighbourhood || address.quarter) {
        parts.push(address.suburb || address.neighbourhood || address.quarter);
      }
      
      if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village);
      } else if (address.municipality) {
        parts.push(address.municipality);
      }
      
      if (address.state || address.region) {
        parts.push(address.state || address.region);
      }
      
      if (address.country) {
        parts.push(address.country);
      }

      const locationName = parts.length > 0 ? parts.join(', ') : data.display_name;
      
      return locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
    } catch (error) {
      console.error('OSM Reverse geocoding failed:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }

  /**
   * Geocoding - Convertir adresse en coordonnées
   */
  async geocode(address: string): Promise<{ lat: number; lon: number; display_name: string } | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.baseUrl}/search?format=json&q=${encodedAddress}&limit=1&countrycodes=cm&addressdetails=1&accept-language=fr`;
      
      console.log(`🗺️ OSM Geocoding: ${address}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status}`);
      }

      const data: any = await response.json();
      
      if (data.length === 0) {
        return null;
      }

      const result = data[0];
      
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name
      };
      
    } catch (error) {
      console.error('OSM Geocoding failed:', error);
      return null;
    }
  }

  /**
   * Rechercher des lieux au Cameroun
   */
  async searchPlaces(query: string): Promise<Array<{
    key: string;
    name: string;
    location: { lat: number; lng: number };
    country: string;
    city: string;
  }>> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}/search?format=json&q=${encodedQuery}&limit=10&countrycodes=cm&addressdetails=1&accept-language=fr`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OSM API error: ${response.status}`);
      }

      const data: any = await response.json();
      
      return data.map((place: any, index: number) => ({
        key: `osm_${place.place_id || index}`,
        name: place.display_name,
        location: {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        },
        country: place.address?.country || 'Cameroun',
        city: place.address?.city || place.address?.town || place.address?.village || ''
      }));
      
    } catch (error) {
      console.error('OSM Places search failed:', error);
      return [];
    }
  }

  /**
   * Obtenir les zones par défaut du Cameroun
   */
  getDefaultCameroonAreas(): Array<{
    key: string;
    name: string;
    location: { lat: number; lng: number };
    country: string;
    city: string;
  }> {
    return [
      {
        key: 'douala_akwa',
        name: 'Akwa, Douala',
        location: { lat: 4.0511, lng: 9.7679 },
        country: 'Cameroun',
        city: 'Douala'
      },
      {
        key: 'douala_bonapriso',
        name: 'Bonapriso, Douala',
        location: { lat: 4.061206, lng: 9.751580 },
        country: 'Cameroun',
        city: 'Douala'
      },
      {
        key: 'douala_bonaberi',
        name: 'Bonabéri, Douala',
        location: { lat: 4.067437, lng: 9.761799 },
        country: 'Cameroun',
        city: 'Douala'
      },
      {
        key: 'douala_deido',
        name: 'Deido, Douala',
        location: { lat: 4.0683, lng: 9.7724 },
        country: 'Cameroun',
        city: 'Douala'
      },
      {
        key: 'yaounde_centre',
        name: 'Centre-ville, Yaoundé',
        location: { lat: 3.8667, lng: 11.5167 },
        country: 'Cameroun',
        city: 'Yaoundé'
      },
      {
        key: 'yaounde_bastos',
        name: 'Bastos, Yaoundé',
        location: { lat: 3.8820, lng: 11.5156 },
        country: 'Cameroun',
        city: 'Yaoundé'
      },
      {
        key: 'limbe_centre',
        name: 'Limbe',
        location: { lat: 4.1536, lng: 9.2253 },
        country: 'Cameroun',
        city: 'Limbe'
      },
      {
        key: 'bamenda_centre',
        name: 'Bamenda',
        location: { lat: 5.9631, lng: 10.1591 },
        country: 'Cameroun',
        city: 'Bamenda'
      }
    ];
  }
}

export default new OpenStreetMapService();