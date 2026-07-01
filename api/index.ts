import { initializeStorage } from '../backend/src/utils/storage';
import app from '../backend/src/app';

// Initialize storage on cold start (idempotent — safe to call multiple times)
initializeStorage().catch(err => console.error('Storage init failed:', err));

export default app;
