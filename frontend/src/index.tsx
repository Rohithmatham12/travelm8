import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { initTheme } from './utils/theme';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

initTheme();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Prompt the waiting SW to skip waiting so the new version activates
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Simple reload prompt — no external toast lib needed
    const msg = document.createElement('div');
    msg.style.cssText =
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;' +
      'background:#111827;color:#f9fafb;padding:12px 20px;border-radius:10px;font-size:14px;' +
      'display:flex;gap:12px;align-items:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
    msg.innerHTML =
      '<span>New version available</span>' +
      '<button onclick="window.location.reload()" style="background:#F97316;color:#fff;border:none;' +
      'padding:6px 14px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">Reload</button>';
    document.body.appendChild(msg);
  },
});

reportWebVitals();
