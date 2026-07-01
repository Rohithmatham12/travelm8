import express from 'express';
import cors from 'cors';
import { tripsRouter } from './routes/trips';
import { recommendationsRouter } from './routes/recommendations';
import { externalRouter } from './routes/external';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { routePlanningRouter } from './routes/routePlanning';

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
app.use('/trips', tripsRouter);
app.use('/recommendations', recommendationsRouter);
app.use('/route', routePlanningRouter);
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
