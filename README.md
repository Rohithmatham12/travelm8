# TravelM8 - AI-Powered Smart Travel Planner

![TravelM8 Logo](https://img.shields.io/badge/TravelM8-AI%20Travel%20Planner-blue?style=for-the-badge&logo=airplane)

TravelM8 is a fully functional, cost-free travel planning platform that helps users plan and schedule their trips. It offers offline maps, suggests the best routes with points of interest, and recommends nearby restaurants and motels based on time of day. Users can also add their trip itinerary to the calendar for easy access, making the entire journey seamless, with personalized insights and suggestions along the way.

## 🚀 Features

### Core Functionality
- **User Authentication**: Simple JWT-based sign-up/sign-in (no AWS costs)
- **Trip Management**: Create, read, update, and delete travel plans
- **AI Recommendations**: Intelligent suggestions for accommodations, activities, restaurants, and attractions
- **Time-Based Recommendations**: Restaurant and motel suggestions based on time of day
- **Offline Maps**: Interactive maps using Leaflet and OpenStreetMap (completely free)
- **Route Planning**: Visual route planning with points of interest
- **Calendar Integration**: View and manage trip itinerary in calendar format
- **Real-time Data**: Weather, currency rates, flight, and hotel information (mock data)
- **Responsive UI**: Modern React frontend with beautiful, mobile-friendly design

### Technical Features
- **Express.js Backend**: Node.js server with Express (no AWS Lambda costs)
- **JSON File Storage**: Local file-based storage (no DynamoDB costs)
- **JWT Authentication**: Simple token-based authentication (no Cognito costs)
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Cost Optimized**: 100% FREE - No cloud service costs
- **Scalable**: Ready for future AWS integration when needed

## 🏗️ Architecture (100% FREE)

### ✅ **FREE TECHNOLOGIES USED:**
- **Frontend**: React with TypeScript, runs locally
- **Backend**: Express.js server running on Node.js
- **Database**: JSON file storage (no database costs)
- **Authentication**: JWT tokens (no authentication service costs)
- **Maps**: Leaflet + OpenStreetMap (completely free)
- **API**: Express REST API (no API Gateway costs)

### 💰 **TOTAL COST: $0** (Completely Free)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Express.js    │    │   JSON Files   │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Storage)    │
│   Localhost     │    │   Localhost     │    │   Local Files  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       ▼
         │                       │              ┌─────────────────┐
         │                       │              │   Leaflet Maps  │
         │                       │              │   OpenStreetMap│
         │                       │              └─────────────────┘
         │                       │
         ▼                       │
┌─────────────────┐              │
│   JWT Auth      │              │
│   (Local)       │              │
└─────────────────┘              │
                                 │
                                 ▼
                    ┌─────────────────┐
                    │   Calendar      │
                    │   Integration   │
                    └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- React Router for navigation
- React Hook Form for form management
- Leaflet + React-Leaflet for maps
- Date-fns for calendar functionality
- Modern CSS with responsive design

**Backend:**
- Express.js (Node.js 20)
- JWT for authentication
- JSON file storage
- TypeScript

## 📁 Project Structure

```
travelm8/
├── backend/                 # Express.js server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/      # Business logic services
│   │   ├── utils/         # Utility functions (storage, auth)
│   │   ├── types/          # TypeScript type definitions
│   │   └── server.ts      # Express server entry point
│   ├── data/              # JSON file storage (created at runtime)
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── TripMap.tsx      # Map component
│   │   │   ├── TripCalendar.tsx # Calendar component
│   │   │   └── ...
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/         # API utilities
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- No AWS account needed!

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd travelm8

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### 3. Start Frontend

In a new terminal:

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000`

### 4. Create Your First Account

1. Open `http://localhost:3000` in your browser
2. Click "Sign Up" to create a new account
3. Start planning your trips!

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user

### Trip Management
- `GET /trips` - List user's trips
- `POST /trips` - Create a new trip
- `GET /trips/:tripId` - Get trip details
- `PUT /trips/:tripId` - Update trip
- `DELETE /trips/:tripId` - Delete trip

### AI Recommendations
- `POST /recommendations` - Get AI-powered travel recommendations

### External Data
- `GET /travel-info?destination={city}` - Get travel information (weather, currency, tips)
- `GET /flights?origin={city}&destination={city}&date={YYYY-MM-DD}` - Get flight options
- `GET /hotels?destination={city}&checkIn={date}&checkOut={date}&guests={number}` - Get hotel options

### Health Check
- `GET /health` - Service health check (no auth required)

## 🗺️ Map Features

- **Interactive Maps**: View trip destinations and itinerary items on maps
- **Points of Interest**: See all activities, restaurants, and accommodations on the map
- **Offline Support**: Maps work offline using cached tiles
- **Route Visualization**: See your trip route on the map

## 📅 Calendar Features

- **Monthly View**: See your entire trip in calendar format
- **Activity Indicators**: Visual indicators for days with activities
- **Date Navigation**: Easy navigation between months
- **Click to View**: Click on dates to see detailed itinerary

## 💡 Key Features

### Time-Based Recommendations
- **Breakfast Spots**: Recommended for morning hours (6 AM - 12 PM)
- **Lunch Restaurants**: Suggested for midday (12 PM - 5 PM)
- **Dinner Options**: Perfect for evening (5 PM - 10 PM)
- **Late Night Motels**: Available for late arrivals (10 PM - 6 AM)

### AI-Powered Suggestions
- Personalized recommendations based on:
  - Budget level (budget, mid-range, luxury)
  - Travel preferences
  - Number of travelers
  - Trip duration
  - Activity preferences

## 🔒 Security

- **Authentication**: JWT tokens stored in localStorage
- **Password Hashing**: bcrypt for secure password storage
- **CORS**: Properly configured for frontend domain
- **Input Validation**: Server-side validation for all inputs

## 🚀 Future AWS Integration

The AWS code has been preserved in separate files for future integration:
- `backend/src/utils/dynamodb.ts` - DynamoDB utilities (not currently used)
- `backend/src/trips/*.ts` - Lambda handler functions (not currently used)
- `infrastructure/` - AWS CDK infrastructure code (not currently used)

When ready to migrate to AWS:
1. Deploy infrastructure using CDK
2. Update backend to use DynamoDB instead of JSON storage
3. Update frontend to use AWS Amplify
4. Configure environment variables

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenStreetMap for free map tiles
- Leaflet for the mapping library
- React and TypeScript communities
- Open source contributors

## 📞 Support

For support, create an issue in the GitHub repository.

## 🔮 Roadmap

### Phase 1 (Current) ✅
- ✅ Basic trip management
- ✅ AI recommendations
- ✅ Time-based restaurant/motel recommendations
- ✅ Offline maps
- ✅ Calendar integration
- ✅ JSON file storage
- ✅ JWT authentication

### Phase 2 (Future)
- [ ] Real geocoding API integration
- [ ] Advanced route optimization
- [ ] Social features (share trips)
- [ ] Mobile app (React Native)
- [ ] Payment integration
- [ ] Real-time notifications

### Phase 3 (Advanced)
- [ ] Machine learning for personalization
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Enterprise features
- [ ] AWS migration (optional)

---

**Built with ❤️ using Free and Open Source Technologies**
