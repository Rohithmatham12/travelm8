import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../utils/auth';
import { TripService } from '../services/tripService';
import { FeedbackService } from '../services/feedbackService';
import { CreateTripRequest, UpdateTripRequest, BudgetEntry, BudgetCategory } from '../types/trip';
import { SaveFeedbackRequest } from '../types/feedback';
import { getItem, putItem, queryItems } from '../utils/storage';
import type { Trip } from '../types/trip';
import {
  successResponse,
  createdResponse,
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse
} from '../utils/response';
import { sendTripInviteEmail } from '../utils/email';

export const tripsRouter = Router();
const tripService = new TripService();
const feedbackService = new FeedbackService();

// All routes require authentication
tripsRouter.use(authenticateToken);

// List trips
tripsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 20;
    const nextToken = req.query.nextToken as string | undefined;

    const result = await tripService.listUserTrips(userId, limit, nextToken);
    successResponse(res, result);
  } catch (error) {
    console.error('Error listing trips:', error);
    internalErrorResponse(res, 'Failed to list trips');
  }
});

// Update trip notes
tripsRouter.patch('/:tripId/notes', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;
    const { notes } = req.body;
    if (typeof notes !== 'string') return badRequestResponse(res, 'notes must be a string');
    const trip = await tripService.updateNotes(userId, tripId, notes);
    if (!trip) return notFoundResponse(res, 'Trip not found');
    return successResponse(res, trip);
  } catch (error) {
    console.error('Error updating trip notes:', error);
    return internalErrorResponse(res, 'Failed to update notes');
  }
});

// Get trip by ID
tripsRouter.get('/:tripId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;

    const trip = await tripService.getTrip(userId, tripId);
    if (!trip) {
      return notFoundResponse(res, 'Trip not found');
    }

    successResponse(res, trip);
  } catch (error) {
    console.error('Error getting trip:', error);
    internalErrorResponse(res, 'Failed to get trip');
  }
});

// Save a full route plan as a trip (one-click save from RoutePlanner)
tripsRouter.post('/save-route', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { routeRequest, routePlan, finalItinerary } = req.body;

    if (!routeRequest?.origin || !routeRequest?.destination) {
      return badRequestResponse(res, 'routeRequest with origin and destination required');
    }

    const title = `${routeRequest.origin} → ${routeRequest.destination}`;
    const startDate = routeRequest.departureDate || new Date().toISOString().split('T')[0];

    const trip = await tripService.createTrip(userId, {
      title,
      destination: routeRequest.destination,
      startDate,
      endDate: startDate,
      travelers: routeRequest.travelers || 1,
      preferences: {},
      routeData: { routeRequest, routePlan, finalItinerary },
    });

    return createdResponse(res, trip, 'Trip saved');
  } catch (error) {
    console.error('Error saving route trip:', error);
    return internalErrorResponse(res, 'Failed to save trip');
  }
});

// Create trip
tripsRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const request: CreateTripRequest = req.body;

    // Validate required fields
    const requiredFields = ['title', 'destination', 'startDate', 'endDate', 'travelers'];
    const missingFields = requiredFields.filter(field => !request[field as keyof CreateTripRequest]);

    if (missingFields.length > 0) {
      return badRequestResponse(res, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate dates
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return badRequestResponse(res, 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
    }

    if (startDate > endDate) {
      return badRequestResponse(res, 'End date must be the same as or after start date');
    }

    // Validate travelers count
    if (request.travelers < 1 || request.travelers > 20) {
      return badRequestResponse(res, 'Number of travelers must be between 1 and 20');
    }

    const trip = await tripService.createTrip(userId, request);
    createdResponse(res, trip, 'Trip created successfully');
  } catch (error) {
    console.error('Error creating trip:', error);
    internalErrorResponse(res, 'Failed to create trip');
  }
});

// Update trip
tripsRouter.put('/:tripId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;
    const updates: UpdateTripRequest = req.body;

    // Validate dates if provided
    if (updates.startDate && updates.endDate) {
      const startDate = new Date(updates.startDate);
      const endDate = new Date(updates.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return badRequestResponse(res, 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
      }

      if (startDate > endDate) {
        return badRequestResponse(res, 'End date must be the same as or after start date');
      }
    }

    const trip = await tripService.updateTrip(userId, tripId, updates);
    if (!trip) {
      return notFoundResponse(res, 'Trip not found');
    }

    successResponse(res, trip, 'Trip updated successfully');
  } catch (error) {
    console.error('Error updating trip:', error);
    internalErrorResponse(res, 'Failed to update trip');
  }
});

// Delete trip
tripsRouter.delete('/:tripId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;

    await tripService.deleteTrip(userId, tripId);
    successResponse(res, { tripId }, 'Trip deleted successfully');
  } catch (error) {
    console.error('Error deleting trip:', error);
    internalErrorResponse(res, 'Failed to delete trip');
  }
});

// Add itinerary item
tripsRouter.post('/:tripId/itinerary', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;
    const item = req.body;

    const trip = await tripService.addItineraryItem(userId, tripId, item);
    if (!trip) {
      return notFoundResponse(res, 'Trip not found');
    }

    successResponse(res, trip, 'Itinerary item added successfully');
  } catch (error) {
    console.error('Error adding itinerary item:', error);
    internalErrorResponse(res, 'Failed to add itinerary item');
  }
});

// Update itinerary item
tripsRouter.put('/:tripId/itinerary/:itemId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId, itemId } = req.params;
    const updates = req.body;

    const trip = await tripService.updateItineraryItem(userId, tripId, itemId, updates);
    if (!trip) {
      return notFoundResponse(res, 'Trip or itinerary item not found');
    }

    successResponse(res, trip, 'Itinerary item updated successfully');
  } catch (error) {
    console.error('Error updating itinerary item:', error);
    internalErrorResponse(res, 'Failed to update itinerary item');
  }
});

// Save post-trip feedback (upsert — one per trip)
tripsRouter.post('/:tripId/feedback', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;
    const { rating, whatWorked, whatDidnt, overallNote } = req.body as SaveFeedbackRequest;

    if (!rating || rating < 1 || rating > 5) return badRequestResponse(res, 'rating must be 1–5');

    const feedback = await feedbackService.saveFeedback(userId, tripId, {
      rating,
      whatWorked: whatWorked || '',
      whatDidnt: whatDidnt || '',
      overallNote: overallNote || '',
    });
    return successResponse(res, feedback, 'Feedback saved');
  } catch (error) {
    console.error('Error saving feedback:', error);
    return internalErrorResponse(res, 'Failed to save feedback');
  }
});

// Get post-trip feedback
tripsRouter.get('/:tripId/feedback', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId } = req.params;
    const feedback = await feedbackService.getFeedback(userId, tripId);
    return successResponse(res, feedback);
  } catch (error) {
    console.error('Error getting feedback:', error);
    return internalErrorResponse(res, 'Failed to get feedback');
  }
});

// ── Budget tracker ──────────────────────────────────────────────────────────

const VALID_CATEGORIES: BudgetCategory[] = ['fuel', 'food', 'lodging', 'activities', 'misc'];

function budgetTotals(entries: BudgetEntry[]) {
  const byCategory: Record<BudgetCategory, number> = { fuel: 0, food: 0, lodging: 0, activities: 0, misc: 0 };
  for (const e of entries) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
  return { total, byCategory };
}

tripsRouter.get('/:tripId/budget', async (req: AuthRequest, res) => {
  try {
    const trip = await getItem('trips', { userId: req.userId!, tripId: req.params.tripId }) as Trip | null;
    if (!trip) return notFoundResponse(res, 'Trip not found');
    const entries = trip.spendEntries || [];
    const totals = budgetTotals(entries);
    return successResponse(res, { estimatedBudget: trip.budget ?? null, spendEntries: entries, totals });
  } catch (error) {
    console.error('Budget GET error:', error);
    return internalErrorResponse(res, 'Failed to fetch budget');
  }
});

tripsRouter.post('/:tripId/budget/entries', async (req: AuthRequest, res) => {
  try {
    const { category, amount, description, date } = req.body;
    if (!VALID_CATEGORIES.includes(category)) return badRequestResponse(res, `category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    const amt = Number(amount);
    if (!amt || amt <= 0) return badRequestResponse(res, 'amount must be a positive number');

    const trip = await getItem('trips', { userId: req.userId!, tripId: req.params.tripId }) as Trip | null;
    if (!trip) return notFoundResponse(res, 'Trip not found');

    const entry: BudgetEntry = {
      entryId: uuidv4(),
      category,
      amount: amt,
      description: description?.trim() || undefined,
      date: date || new Date().toISOString().slice(0, 10),
    };
    const entries = [...(trip.spendEntries || []), entry];
    await putItem('trips', { ...trip, spendEntries: entries, updatedAt: new Date().toISOString() });
    return successResponse(res, { entry, totals: budgetTotals(entries) }, 'Entry added');
  } catch (error) {
    console.error('Budget POST error:', error);
    return internalErrorResponse(res, 'Failed to add entry');
  }
});

tripsRouter.delete('/:tripId/budget/entries/:entryId', async (req: AuthRequest, res) => {
  try {
    const trip = await getItem('trips', { userId: req.userId!, tripId: req.params.tripId }) as Trip | null;
    if (!trip) return notFoundResponse(res, 'Trip not found');
    const entries = (trip.spendEntries || []).filter(e => e.entryId !== req.params.entryId);
    await putItem('trips', { ...trip, spendEntries: entries, updatedAt: new Date().toISOString() });
    return successResponse(res, { totals: budgetTotals(entries) }, 'Entry removed');
  } catch (error) {
    console.error('Budget DELETE error:', error);
    return internalErrorResponse(res, 'Failed to remove entry');
  }
});

// Remove itinerary item
tripsRouter.delete('/:tripId/itinerary/:itemId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { tripId, itemId } = req.params;

    const trip = await tripService.removeItineraryItem(userId, tripId, itemId);
    if (!trip) {
      return notFoundResponse(res, 'Trip or itinerary item not found');
    }

    successResponse(res, trip, 'Itinerary item removed successfully');
  } catch (error) {
    console.error('Error removing itinerary item:', error);
    internalErrorResponse(res, 'Failed to remove itinerary item');
  }
});

// Send trip invite email
tripsRouter.post('/:tripId/invite', async (req: AuthRequest, res) => {
  try {
    const trip = await getItem('trips', { userId: req.userId!, tripId: req.params.tripId }) as Trip | null;
    if (!trip) return notFoundResponse(res, 'Trip not found');

    const { recipientEmail, note } = req.body as { recipientEmail?: string; note?: string };
    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return badRequestResponse(res, 'Valid recipient email required');
    }

    const senderName = req.user?.name || req.user?.email || 'A TravelM8 user';
    await sendTripInviteEmail(recipientEmail, senderName, trip, note?.trim() || undefined);
    successResponse(res, {}, 'Invite sent');
  } catch (error) {
    console.error('Error sending trip invite:', error);
    internalErrorResponse(res, 'Failed to send invite');
  }
});

// Exported directly to app.ts (bypasses tripsRouter JWT middleware)
import { Request, Response } from 'express';
export async function sendRemindersHandler(req: Request, res: Response): Promise<void> {
  const secret = process.env.INTERNAL_SECRET;
  const provided = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!secret || provided !== secret) {
    res.status(401).json({ success: false, error: 'Unauthorized' }); return;
  }
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const allTrips = await queryItems('trips') as (Trip & { userId: string })[];
    const due = allTrips.filter(t => t.startDate && t.startDate.startsWith(tomorrowStr));
    const results: { tripId: string; status: string }[] = [];

    for (const trip of due) {
      const user = await getItem('users', { userId: trip.userId }) as { pushToken?: string } | null;
      if (!user?.pushToken) { results.push({ tripId: trip.tripId, status: 'no_token' }); continue; }
      try {
        const r = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
          body: JSON.stringify({
            to: user.pushToken,
            title: '🚗 Road trip tomorrow!',
            body: `Your trip to ${trip.destination} starts tomorrow. Pack up and rest tonight.`,
            data: { tripId: trip.tripId },
            sound: 'default',
          }),
        });
        results.push({ tripId: trip.tripId, status: r.ok ? 'sent' : 'expo_error' });
      } catch {
        results.push({ tripId: trip.tripId, status: 'send_failed' });
      }
    }
    successResponse(res, { checked: due.length, results }, 'Reminders processed');
  } catch (error) {
    console.error('send-reminders error:', error);
    internalErrorResponse(res, 'Failed to process reminders');
  }
}
