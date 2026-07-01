import path from 'path';
import fs from 'fs';
import app from './app';
import { getDataDir, initializeStorage, isPostgresStorageEnabled } from './utils/storage';

const PORT = process.env.PORT || 3001;

const dataDir = getDataDir();
if (!isPostgresStorageEnabled() && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Serve built frontend (Render / local prod)
const frontendBuildPath = path.join(__dirname, '../../frontend/build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(require('express').static(frontendBuildPath));
  app.get('*', (_req: any, res: any) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

initializeStorage()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 TravelM8 Backend Server running on port ${PORT}`);
      console.log(`📁 Storage: ${dataDir}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize storage:', error);
    process.exit(1);
  });

export default app;
