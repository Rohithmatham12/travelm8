import { v4 as uuidv4 } from 'uuid';
import { 
  RecommendationRequest, 
  RecommendationResponse, 
  Recommendation, 
  ItineraryDay 
} from '../types/recommendation';

export class RecommendationService {
  private readonly mockData = {
    accommodations: {
      budget: [
        {
          title: 'Hostel Central',
          description: 'Clean and comfortable hostel in the city center',
          category: 'Hostel',
          tags: ['budget', 'central', 'social'],
          basePrice: 25
        },
        {
          title: 'Budget Inn',
          description: 'Simple hotel with basic amenities',
          category: 'Hotel',
          tags: ['budget', 'simple', 'clean'],
          basePrice: 45
        }
      ],
      'mid-range': [
        {
          title: 'City Hotel',
          description: 'Modern hotel with great amenities and location',
          category: 'Hotel',
          tags: ['modern', 'central', 'amenities'],
          basePrice: 120
        },
        {
          title: 'Boutique Hotel',
          description: 'Charming boutique hotel with unique character',
          category: 'Boutique',
          tags: ['boutique', 'charming', 'unique'],
          basePrice: 150
        }
      ],
      luxury: [
        {
          title: 'Grand Resort',
          description: 'Luxury resort with world-class facilities',
          category: 'Resort',
          tags: ['luxury', 'resort', 'spa'],
          basePrice: 400
        },
        {
          title: 'Five Star Palace',
          description: 'Historic palace converted to luxury hotel',
          category: 'Luxury',
          tags: ['luxury', 'historic', 'palace'],
          basePrice: 600
        }
      ]
    },
    activities: [
      {
        title: 'City Walking Tour',
        description: 'Explore the historic city center with a local guide',
        category: 'Sightseeing',
        tags: ['sightseeing', 'culture', 'history'],
        duration: 180,
        basePrice: 25
      },
      {
        title: 'Museum Visit',
        description: 'Visit the famous local museum',
        category: 'Culture',
        tags: ['culture', 'museum', 'art'],
        duration: 120,
        basePrice: 15
      },
      {
        title: 'Food Tour',
        description: 'Taste local cuisine with a food expert',
        category: 'Food',
        tags: ['food', 'local', 'tasting'],
        duration: 240,
        basePrice: 60
      },
      {
        title: 'Adventure Park',
        description: 'Thrilling activities and outdoor adventures',
        category: 'Adventure',
        tags: ['adventure', 'outdoor', 'thrilling'],
        duration: 300,
        basePrice: 45
      },
      {
        title: 'Spa Day',
        description: 'Relaxing spa treatment and wellness',
        category: 'Wellness',
        tags: ['wellness', 'spa', 'relaxation'],
        duration: 180,
        basePrice: 80
      }
    ],
    restaurants: [
      {
        title: 'Local Bistro',
        description: 'Authentic local cuisine in cozy atmosphere',
        category: 'Local',
        tags: ['local', 'authentic', 'cozy'],
        basePrice: 30
      },
      {
        title: 'Fine Dining Restaurant',
        description: 'Upscale dining with gourmet cuisine',
        category: 'Fine Dining',
        tags: ['fine-dining', 'gourmet', 'upscale'],
        basePrice: 120
      },
      {
        title: 'Street Food Market',
        description: 'Experience local street food culture',
        category: 'Street Food',
        tags: ['street-food', 'local', 'casual'],
        basePrice: 15
      }
    ],
    attractions: [
      {
        title: 'Historic Cathedral',
        description: 'Magnificent historic cathedral with stunning architecture',
        category: 'Historic',
        tags: ['historic', 'architecture', 'religious'],
        duration: 90,
        basePrice: 10
      },
      {
        title: 'City Park',
        description: 'Beautiful park perfect for relaxation',
        category: 'Nature',
        tags: ['nature', 'park', 'relaxation'],
        duration: 120,
        basePrice: 0
      },
      {
        title: 'Observation Deck',
        description: 'Panoramic views of the city',
        category: 'Viewpoint',
        tags: ['viewpoint', 'panoramic', 'city'],
        duration: 60,
        basePrice: 20
      }
    ]
  };

  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const duration = this.calculateDuration(request.startDate, request.endDate);
    const budgetLevel = this.determineBudgetLevel(request.budget, request.travelers, duration);
    
    // Determine time of day for recommendations
    const currentHour = new Date().getHours();
    let timeOfDay = 'any';
    if (currentHour >= 6 && currentHour < 12) timeOfDay = 'breakfast';
    else if (currentHour >= 12 && currentHour < 17) timeOfDay = 'lunch';
    else if (currentHour >= 17 && currentHour < 22) timeOfDay = 'dinner';
    else timeOfDay = 'lateNight';
    
    const recommendations = {
      accommodations: this.generateAccommodations(request, budgetLevel),
      activities: this.generateActivities(request, duration),
      restaurants: this.generateRestaurants(request, duration, timeOfDay),
      attractions: this.generateAttractions(request, duration),
      transport: this.generateTransport(request, duration),
      motels: this.generateMotelsByTime(request, timeOfDay)
    };

    const itinerary = this.generateItinerary(request, recommendations, duration, timeOfDay);
    const totalCost = this.calculateTotalCost(recommendations, itinerary, request.travelers);
    const tips = this.generateTips(request, budgetLevel);

    return {
      destination: request.destination,
      recommendations,
      itinerary,
      totalEstimatedCost: totalCost,
      tips
    };
  }

  private calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private determineBudgetLevel(budget?: number, travelers?: number, duration?: number): string {
    if (!budget || !travelers || !duration) return 'mid-range';
    
    const dailyBudgetPerPerson = budget / (travelers * duration);
    
    if (dailyBudgetPerPerson < 50) return 'budget';
    if (dailyBudgetPerPerson > 200) return 'luxury';
    return 'mid-range';
  }

  private generateAccommodations(request: RecommendationRequest, budgetLevel: string): Recommendation[] {
    const accommodations = this.mockData.accommodations[budgetLevel as keyof typeof this.mockData.accommodations] || 
                          this.mockData.accommodations['mid-range'];
    
    return accommodations.slice(0, 3).map(acc => ({
      id: uuidv4(),
      type: 'accommodation' as const,
      title: acc.title,
      description: acc.description,
      location: request.destination,
      rating: 4.0 + Math.random(),
      price: {
        amount: acc.basePrice * (request.travelers || 1),
        currency: request.currency || 'USD',
        perPerson: false
      },
      category: acc.category,
      tags: acc.tags,
      imageUrl: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`
    }));
  }

  private generateActivities(request: RecommendationRequest, duration: number): Recommendation[] {
    const relevantActivities = this.mockData.activities.filter(activity => {
      if (!request.preferences.activityTypes || request.preferences.activityTypes.length === 0) {
        return true;
      }
      return request.preferences.activityTypes.some(type => 
        activity.tags.includes(type) || activity.category.toLowerCase().includes(type)
      );
    });

    return relevantActivities.slice(0, Math.min(8, duration * 2)).map(activity => ({
      id: uuidv4(),
      type: 'activity' as const,
      title: activity.title,
      description: activity.description,
      location: request.destination,
      rating: 4.0 + Math.random(),
      price: {
        amount: activity.basePrice * (request.travelers || 1),
        currency: request.currency || 'USD',
        perPerson: true
      },
      duration: activity.duration,
      category: activity.category,
      tags: activity.tags,
      imageUrl: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`
    }));
  }

  private generateRestaurants(request: RecommendationRequest, duration: number, timeOfDay?: string): Recommendation[] {
    // Enhanced restaurant data with time-based recommendations
    const timeBasedRestaurants = {
      breakfast: [
        { title: 'Sunrise Café', description: 'Perfect morning spot with fresh pastries and coffee', category: 'Café', tags: ['breakfast', 'coffee', 'pastries'], basePrice: 15 },
        { title: 'Local Breakfast Spot', description: 'Traditional breakfast with local specialties', category: 'Local', tags: ['breakfast', 'local', 'traditional'], basePrice: 20 },
        { title: 'Brunch House', description: 'All-day brunch with international options', category: 'Brunch', tags: ['breakfast', 'brunch', 'international'], basePrice: 25 }
      ],
      lunch: [
        { title: 'Local Bistro', description: 'Authentic local cuisine in cozy atmosphere', category: 'Local', tags: ['local', 'authentic', 'cozy'], basePrice: 30 },
        { title: 'Quick Bite', description: 'Fast casual dining perfect for lunch', category: 'Casual', tags: ['lunch', 'casual', 'quick'], basePrice: 20 },
        { title: 'Market Food Hall', description: 'Variety of food stalls and vendors', category: 'Food Hall', tags: ['lunch', 'variety', 'market'], basePrice: 25 }
      ],
      dinner: [
        { title: 'Fine Dining Restaurant', description: 'Upscale dining with gourmet cuisine', category: 'Fine Dining', tags: ['fine-dining', 'gourmet', 'upscale'], basePrice: 120 },
        { title: 'Local Restaurant', description: 'Authentic local cuisine for dinner', category: 'Local', tags: ['dinner', 'local', 'authentic'], basePrice: 50 },
        { title: 'Rooftop Restaurant', description: 'Dinner with stunning city views', category: 'Rooftop', tags: ['dinner', 'rooftop', 'views'], basePrice: 80 }
      ],
      lateNight: [
        { title: 'Street Food Market', description: 'Experience local street food culture', category: 'Street Food', tags: ['street-food', 'local', 'casual'], basePrice: 15 },
        { title: '24/7 Diner', description: 'Late night dining options', category: 'Diner', tags: ['late-night', 'casual', '24/7'], basePrice: 20 },
        { title: 'Night Market', description: 'Vibrant night market with local delicacies', category: 'Night Market', tags: ['late-night', 'market', 'local'], basePrice: 18 }
      ]
    };

    // Determine time-based restaurants if timeOfDay is provided
    let restaurantsToUse = this.mockData.restaurants;
    if (timeOfDay) {
      const timeKey = timeOfDay.toLowerCase() as keyof typeof timeBasedRestaurants;
      if (timeBasedRestaurants[timeKey]) {
        restaurantsToUse = timeBasedRestaurants[timeKey];
      }
    }

    const relevantRestaurants = restaurantsToUse.filter(restaurant => {
      if (!request.preferences.foodPreferences || request.preferences.foodPreferences.length === 0) {
        return true;
      }
      return request.preferences.foodPreferences.some(pref => 
        restaurant.tags.includes(pref) || restaurant.category.toLowerCase().includes(pref)
      );
    });

    return relevantRestaurants.slice(0, Math.min(6, duration * 2)).map(restaurant => ({
      id: uuidv4(),
      type: 'restaurant' as const,
      title: restaurant.title,
      description: restaurant.description,
      location: request.destination,
      rating: 4.0 + Math.random(),
      price: {
        amount: restaurant.basePrice * (request.travelers || 1),
        currency: request.currency || 'USD',
        perPerson: true
      },
      category: restaurant.category,
      tags: restaurant.tags,
      imageUrl: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
      recommendedTime: timeOfDay || 'any'
    }));
  }

  /**
   * Generate motel/hotel recommendations based on time of day
   */
  private generateMotelsByTime(request: RecommendationRequest, timeOfDay: string): Recommendation[] {
    const currentHour = new Date().getHours();
    const isLateNight = currentHour >= 22 || currentHour < 6;
    
    const motels = [
      {
        title: 'Budget Motel',
        description: isLateNight ? '24/7 check-in available, perfect for late arrivals' : 'Convenient location near city center',
        category: 'Motel',
        tags: ['budget', 'convenient', isLateNight ? '24/7' : 'standard'],
        basePrice: 45
      },
      {
        title: 'Highway Motel',
        description: isLateNight ? 'Easy access from highway, late check-in welcome' : 'Great for road trips',
        category: 'Motel',
        tags: ['highway', 'road-trip', isLateNight ? 'late-checkin' : 'standard'],
        basePrice: 55
      },
      {
        title: 'City Motel',
        description: isLateNight ? 'Downtown location with flexible check-in' : 'Central location',
        category: 'Motel',
        tags: ['city', 'central', isLateNight ? 'flexible' : 'standard'],
        basePrice: 65
      }
    ];

    return motels.map(motel => ({
      id: uuidv4(),
      type: 'accommodation' as const,
      title: motel.title,
      description: motel.description,
      location: request.destination,
      rating: 3.5 + Math.random() * 1.5,
      price: {
        amount: motel.basePrice * (request.travelers || 1),
        currency: request.currency || 'USD',
        perPerson: false
      },
      category: motel.category,
      tags: motel.tags,
      imageUrl: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
      recommendedTime: timeOfDay
    }));
  }

  private generateAttractions(request: RecommendationRequest, duration: number): Recommendation[] {
    return this.mockData.attractions.slice(0, Math.min(5, duration)).map(attraction => ({
      id: uuidv4(),
      type: 'attraction' as const,
      title: attraction.title,
      description: attraction.description,
      location: request.destination,
      rating: 4.0 + Math.random(),
      price: {
        amount: attraction.basePrice * (request.travelers || 1),
        currency: request.currency || 'USD',
        perPerson: true
      },
      duration: attraction.duration,
      category: attraction.category,
      tags: attraction.tags,
      imageUrl: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`
    }));
  }

  private generateTransport(request: RecommendationRequest, duration: number): Recommendation[] {
    const transportOptions = [
      {
        title: 'Public Transport Pass',
        description: 'Unlimited public transport for the duration',
        category: 'Public',
        basePrice: 15
      },
      {
        title: 'Car Rental',
        description: 'Daily car rental with insurance',
        category: 'Car',
        basePrice: 50
      },
      {
        title: 'Taxi Service',
        description: 'On-demand taxi service',
        category: 'Taxi',
        basePrice: 25
      }
    ];

    return transportOptions.map(transport => ({
      id: uuidv4(),
      type: 'transport' as const,
      title: transport.title,
      description: transport.description,
      location: request.destination,
      price: {
        amount: transport.basePrice * duration * (request.travelers || 1),
        currency: request.currency || 'USD',
        perPerson: false
      },
      category: transport.category,
      tags: [transport.category.toLowerCase(), 'transport']
    }));
  }

  private generateItinerary(
    request: RecommendationRequest, 
    recommendations: any, 
    duration: number,
    timeOfDay?: string
  ): ItineraryDay[] {
    const itinerary: ItineraryDay[] = [];
    const startDate = new Date(request.startDate);

    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Determine time-based recommendations for each day
      const dayHour = (currentDate.getHours() + i * 24) % 24;
      let dayTimeOfDay = 'any';
      if (dayHour >= 6 && dayHour < 12) dayTimeOfDay = 'breakfast';
      else if (dayHour >= 12 && dayHour < 17) dayTimeOfDay = 'lunch';
      else if (dayHour >= 17 && dayHour < 22) dayTimeOfDay = 'dinner';
      else dayTimeOfDay = 'lateNight';

      const dayActivities = this.selectRandomItems(recommendations.activities, 2);
      
      // Select time-appropriate restaurants
      const timeBasedRestaurants = recommendations.restaurants.filter((r: any) => 
        !r.recommendedTime || r.recommendedTime === dayTimeOfDay || r.recommendedTime === 'any'
      );
      const dayMeals = this.selectRandomItems(
        timeBasedRestaurants.length > 0 ? timeBasedRestaurants : recommendations.restaurants, 
        2
      );
      
      const dayAccommodation = i === 0 ? recommendations.accommodations[0] : undefined;
      const dayTransport = this.selectRandomItems(recommendations.transport, 1);
      
      // Add motel recommendation if late night
      const dayMotels = dayTimeOfDay === 'lateNight' ? 
        this.selectRandomItems(recommendations.motels || [], 1) : undefined;

      const dayCost = this.calculateDayCost(dayActivities, dayMeals, dayAccommodation, dayTransport);

      itinerary.push({
        date: currentDate.toISOString().split('T')[0],
        dayNumber: i + 1,
        activities: dayActivities,
        meals: dayMeals,
        accommodation: dayAccommodation || dayMotels?.[0],
        transport: dayTransport,
        estimatedCost: {
          amount: dayCost,
          currency: request.currency || 'USD'
        }
      });
    }

    return itinerary;
  }

  private selectRandomItems<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private calculateDayCost(activities: any[], meals: any[], accommodation?: any, transport?: any[]): number {
    let cost = 0;
    
    activities.forEach(activity => cost += activity.price?.amount || 0);
    meals.forEach(meal => cost += meal.price?.amount || 0);
    if (accommodation) cost += accommodation.price?.amount || 0;
    transport?.forEach(t => cost += t.price?.amount || 0);
    
    return cost;
  }

  private calculateTotalCost(recommendations: any, itinerary: ItineraryDay[], travelers: number): { amount: number; currency: string } {
    let totalCost = 0;
    
    itinerary.forEach(day => {
      totalCost += day.estimatedCost.amount;
    });

    return {
      amount: Math.round(totalCost),
      currency: 'USD'
    };
  }

  private generateTips(request: RecommendationRequest, budgetLevel: string): string[] {
    const tips = [
      `Book accommodations in advance for better rates in ${request.destination}`,
      `Consider purchasing a city pass for discounted attractions`,
      `Try local transportation to experience the city like a local`,
      `Pack comfortable walking shoes for exploring`,
      `Learn a few basic phrases in the local language`
    ];

    if (budgetLevel === 'budget') {
      tips.push('Look for free walking tours and free museum days');
      tips.push('Consider staying in hostels or budget accommodations');
    } else if (budgetLevel === 'luxury') {
      tips.push('Book spa treatments and fine dining experiences in advance');
      tips.push('Consider private tours for a more personalized experience');
    }

    return tips.slice(0, 5);
  }
}
