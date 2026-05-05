import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { tripsRouter } from './routes/trips';
import { recommendationsRouter } from './routes/recommendations';
import { externalRouter } from './routes/external';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : allowedOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/trips', tripsRouter);
app.use('/recommendations', recommendationsRouter);
app.use('/travel-info', externalRouter);
app.use('/flights', externalRouter);
app.use('/hotels', externalRouter);

const frontendBuildPath = path.join(__dirname, '../../frontend/build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TravelM8 Backend Server running on port ${PORT}`);
  console.log(`📁 Data directory: ${dataDir}`);
});

export default app;
