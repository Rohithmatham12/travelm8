// External API service for real-time travel data
// Using free APIs to provide weather, currency, and basic travel information

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  description: string;
  icon?: string;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

export interface TravelInfo {
  destination: string;
  weather?: WeatherData;
  currencyRates?: CurrencyRate[];
  timezone?: string;
  localTime?: string;
  tips?: string[];
}

export class ExternalApiService {
  private readonly WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';
  private readonly CURRENCY_API_BASE = 'https://api.exchangerate-api.com/v4/latest';
  private readonly RESTCOUNTRIES_API_BASE = 'https://restcountries.com/v3.1';

  /**
   * Get weather information for a destination
   * Note: This is a mock implementation. In production, you'd use a real weather API
   */
  async getWeatherData(destination: string): Promise<WeatherData> {
    // Mock weather data - in production, integrate with OpenWeatherMap or similar
    const mockWeatherData: WeatherData[] = [
      {
        location: destination,
        temperature: Math.round(15 + Math.random() * 20), // 15-35°C
        condition: ['sunny', 'cloudy', 'partly cloudy', 'rainy'][Math.floor(Math.random() * 4)],
        humidity: Math.round(40 + Math.random() * 40), // 40-80%
        windSpeed: Math.round(5 + Math.random() * 15), // 5-20 km/h
        description: `Pleasant weather in ${destination}`,
        icon: '☀️'
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    return mockWeatherData[0];
  }

  /**
   * Get currency exchange rates
   * Note: This is a mock implementation. In production, use a real currency API
   */
  async getCurrencyRates(baseCurrency: string = 'USD'): Promise<CurrencyRate[]> {
    const commonCurrencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
    
    // Mock currency rates
    const rates: CurrencyRate[] = commonCurrencies.map(currency => ({
      from: baseCurrency,
      to: currency,
      rate: 0.5 + Math.random() * 2, // Random rates between 0.5 and 2.5
      lastUpdated: new Date().toISOString()
    }));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    return rates;
  }

  /**
   * Get basic travel information for a destination
   */
  async getTravelInfo(destination: string): Promise<TravelInfo> {
    try {
      // Get weather data
      const weather = await this.getWeatherData(destination);
      
      // Get currency rates
      const currencyRates = await this.getCurrencyRates();

      // Mock timezone and local time
      const timezone = this.getMockTimezone(destination);
      const localTime = new Date().toLocaleString('en-US', { 
        timeZone: timezone,
        hour12: true 
      });

      // Generate travel tips
      const tips = this.generateTravelTips(destination);

      return {
        destination,
        weather,
        currencyRates,
        timezone,
        localTime,
        tips
      };
    } catch (error) {
      console.error('Error fetching travel info:', error);
      throw new Error('Failed to fetch travel information');
    }
  }

  /**
   * Get flight information (mock implementation)
   */
  async getFlights(origin: string, destination: string, date: string): Promise<any[]> {
    // Mock flight data
    const airlines = ['American Airlines', 'Delta', 'United', 'Southwest', 'JetBlue'];
    const flightClasses = ['Economy', 'Premium Economy', 'Business', 'First'];
    
    const flights = Array.from({ length: 5 }, (_, i) => ({
      id: `FL${1000 + i}`,
      airline: airlines[Math.floor(Math.random() * airlines.length)],
      flightNumber: `${Math.floor(Math.random() * 9000) + 1000}`,
      origin,
      destination,
      departure: new Date(date).toISOString(),
      arrival: new Date(new Date(date).getTime() + (2 + Math.random() * 8) * 60 * 60 * 1000).toISOString(),
      duration: `${Math.floor(2 + Math.random() * 8)}h ${Math.floor(Math.random() * 60)}m`,
      price: Math.round(200 + Math.random() * 800),
      currency: 'USD',
      class: flightClasses[Math.floor(Math.random() * flightClasses.length)],
      stops: Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0
    }));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    return flights;
  }

  /**
   * Get hotel information (mock implementation)
   */
  async getHotels(destination: string, checkIn: string, checkOut: string, guests: number): Promise<any[]> {
    const hotelChains = ['Marriott', 'Hilton', 'Hyatt', 'InterContinental', 'Holiday Inn'];
    const hotelTypes = ['Hotel', 'Resort', 'Boutique Hotel', 'Business Hotel', 'Luxury Resort'];
    
    const hotels = Array.from({ length: 8 }, (_, i) => ({
      id: `HT${2000 + i}`,
      name: `${hotelChains[Math.floor(Math.random() * hotelChains.length)]} ${destination}`,
      type: hotelTypes[Math.floor(Math.random() * hotelTypes.length)],
      location: destination,
      rating: 3 + Math.random() * 2, // 3-5 stars
      price: Math.round(80 + Math.random() * 400), // $80-$480 per night
      currency: 'USD',
      amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Spa', 'Parking'].slice(0, Math.floor(3 + Math.random() * 4)),
      checkIn,
      checkOut,
      guests,
      imageUrl: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`
    }));

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 1000));

    return hotels;
  }

  private getMockTimezone(destination: string): string {
    // Mock timezone mapping
    const timezoneMap: { [key: string]: string } = {
      'paris': 'Europe/Paris',
      'london': 'Europe/London',
      'tokyo': 'Asia/Tokyo',
      'new york': 'America/New_York',
      'los angeles': 'America/Los_Angeles',
      'sydney': 'Australia/Sydney',
      'rome': 'Europe/Rome',
      'madrid': 'Europe/Madrid',
      'berlin': 'Europe/Berlin',
      'amsterdam': 'Europe/Amsterdam'
    };

    const normalizedDestination = destination.toLowerCase();
    return timezoneMap[normalizedDestination] || 'UTC';
  }

  private generateTravelTips(destination: string): string[] {
    const generalTips = [
      'Check visa requirements before traveling',
      'Pack appropriate clothing for the season',
      'Keep copies of important documents',
      'Inform your bank about travel plans',
      'Download offline maps and translation apps'
    ];

    const destinationTips: { [key: string]: string[] } = {
      'paris': [
        'Learn basic French phrases',
        'Visit museums on free days',
        'Try local patisseries',
        'Use the Metro for transportation'
      ],
      'london': [
        'Get an Oyster card for public transport',
        'Visit free museums',
        'Try traditional afternoon tea',
        'Be prepared for unpredictable weather'
      ],
      'tokyo': [
        'Learn basic Japanese etiquette',
        'Get a JR Pass for train travel',
        'Try authentic ramen',
        'Visit temples and gardens'
      ]
    };

    const normalizedDestination = destination.toLowerCase();
    const specificTips = destinationTips[normalizedDestination] || [];
    
    return [...generalTips, ...specificTips].slice(0, 8);
  }
}
