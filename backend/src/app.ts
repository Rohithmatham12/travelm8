import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { tripsRouter, sendRemindersHandler, publicTripHandler, autoCompleteTripHandler } from './routes/trips';
import { recommendationsRouter } from './routes/recommendations';
import { externalRouter } from './routes/external';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { routePlanningRouter } from './routes/routePlanning';
import { voteSessionRouter } from './routes/voteSession';
import { analyticsRouter } from './routes/analytics';

const app = express();

// Rate limiters — in-memory per instance (sufficient for Vercel + protects Groq quota)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again in 15 minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // 15 AI calls per 15 min per IP — protects Groq free tier
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'AI rate limit reached. Try again in 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 login/register attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts. Try again in 15 minutes.' },
});

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : allowedOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.use('/health', healthRouter);
app.use('/auth', authLimiter, authRouter);
app.post('/trips/send-reminders', sendRemindersHandler);   // no JWT — uses INTERNAL_SECRET
app.post('/trips/auto-complete', autoCompleteTripHandler); // no JWT — uses INTERNAL_SECRET
app.get('/trips/public/:token', publicTripHandler);        // no JWT — public share link
app.use('/trips', tripsRouter);
app.use('/recommendations', recommendationsRouter);
app.use('/route', aiLimiter, routePlanningRouter);
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
