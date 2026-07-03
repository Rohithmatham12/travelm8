import express from 'express';
import cors from 'cors';
import { tripsRouter, sendRemindersHandler, publicTripHandler } from './routes/trips';
import { recommendationsRouter } from './routes/recommendations';
import { externalRouter } from './routes/external';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { routePlanningRouter } from './routes/routePlanning';
import { voteSessionRouter } from './routes/voteSession';
import { analyticsRouter } from './routes/analytics';

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : allowedOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.post('/trips/send-reminders', sendRemindersHandler); // no JWT — uses INTERNAL_SECRET
app.get('/trips/public/:token', publicTripHandler);       // no JWT — public share link
app.use('/trips', tripsRouter);
app.use('/recommendations', recommendationsRouter);
app.use('/route', routePlanningRouter);
app.use('/vote-sessions', voteSessionRouter);
app.use('/analytics', analyticsRouter);
app.use('/travel-info', externalRouter);
app.use('/flights', externalRouter);
app.use('/hotels', externalRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

export default app;
