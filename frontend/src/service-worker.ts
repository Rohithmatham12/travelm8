/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

// Precache all build assets injected by CRA's Workbox plugin
precacheAndRoute(self.__WB_MANIFEST);

// App shell fallback for navigate requests (HashRouter — all routes are index.html)
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }: { request: Request; url: URL }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/_')) return false;
    if (url.pathname.match(fileExtensionRegexp)) return false;
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Cache images with a cache-first strategy
registerRoute(
  ({ url }: { url: URL }) =>
    url.origin === self.location.origin &&
    (url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.ico')),
  new CacheFirst({
    cacheName: 'tm8-images',
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  })
);

// Google Fonts — stale-while-revalidate
registerRoute(
  ({ url }: { url: URL }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'tm8-fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 })],
  })
);

// OSRM / Nominatim / tile requests — network-first, short cache
registerRoute(
  ({ url }: { url: URL }) =>
    url.hostname.includes('nominatim') ||
    url.hostname.includes('router.project-osrm') ||
    url.hostname.includes('tile.openstreetmap'),
  new NetworkFirst({
    cacheName: 'tm8-geo',
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 })],
  })
);

// Skip waiting when the app sends SKIP_WAITING
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
