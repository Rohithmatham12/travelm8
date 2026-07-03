import { v4 as uuidv4 } from 'uuid';
import { TripFeedback, SaveFeedbackRequest } from '../types/feedback';
import { putItem, getItem } from '../utils/storage';

const TABLE = 'feedback';

export class FeedbackService {
  async saveFeedback(userId: string, tripId: string, req: SaveFeedbackRequest): Promise<TripFeedback> {
    const now = new Date().toISOString();
    const existing = await this.getFeedback(userId, tripId);

    const feedback: TripFeedback = {
      feedbackId: existing?.feedbackId ?? uuidv4(),
      tripId,
      userId,
      rating: req.rating,
      whatWorked: req.whatWorked.trim(),
      whatDidnt: req.whatDidnt.trim(),
      overallNote: req.overallNote.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await putItem(TABLE, feedback);
    return feedback;
  }

  async getFeedback(userId: string, tripId: string): Promise<TripFeedback | null> {
    return getItem(TABLE, { userId, tripId }) as Promise<TripFeedback | null>;
  }
}
