import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../utils/auth';
import { ExternalApiService } from '../services/externalApiService';
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse
} from '../utils/response';

export const externalRouter = Router();
const externalApiService = new ExternalApiService();

// All routes require authentication
externalRouter.use(authenticateToken);

// Get travel info
externalRouter.get('/travel-info', async (req: AuthRequest, res) => {
  try {
    const destination = req.query.destination as string;
    if (!destination) {
      return badRequestResponse(res, 'Destination parameter is required');
    }

    const travelInfo = await externalApiService.getTravelInfo(destination);
    successResponse(res, travelInfo, 'Travel information retrieved successfully');
  } catch (error) {
    console.error('Error getting travel info:', error);
    internalErrorResponse(res, 'Failed to get travel information');
  }
});

// Get flights
externalRouter.get('/flights', async (req: AuthRequest, res) => {
  try {
    const origin = req.query.origin as string;
    const destination = req.query.destination as string;
    const date = req.query.date as string;

    if (!origin || !destination || !date) {
      return badRequestResponse(res, 'Origin, destination, and date parameters are required');
    }

    const flights = await externalApiService.getFlights(origin, destination, date);
    successResponse(res, flights, 'Flight information retrieved successfully');
  } catch (error) {
    console.error('Error getting flights:', error);
    internalErrorResponse(res, 'Failed to get flight information');
  }
});

// Get hotels
externalRouter.get('/hotels', async (req: AuthRequest, res) => {
  try {
    const destination = req.query.destination as string;
    const checkIn = req.query.checkIn as string;
    const checkOut = req.query.checkOut as string;
    const guests = parseInt(req.query.guests as string) || 1;

    if (!destination || !checkIn || !checkOut) {
      return badRequestResponse(res, 'Destination, checkIn, and checkOut parameters are required');
    }

    const hotels = await externalApiService.getHotels(destination, checkIn, checkOut, guests);
    successResponse(res, hotels, 'Hotel information retrieved successfully');
  } catch (error) {
    console.error('Error getting hotels:', error);
    internalErrorResponse(res, 'Failed to get hotel information');
  }
});

