export interface TripFeedback {
  feedbackId: string;
  tripId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  whatWorked: string;
  whatDidnt: string;
  overallNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveFeedbackRequest {
  rating: 1 | 2 | 3 | 4 | 5;
  whatWorked: string;
  whatDidnt: string;
  overallNote: string;
}
