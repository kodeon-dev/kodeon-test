import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';
import './styles/core.css';

Sentry.init({
  dsn: 'https://dc65ad6d955dadaa35bffda15afd31e0@o4508089398132736.ingest.de.sentry.io/4508462814134352',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  (async () => {
    try {
      const sw = import.meta.env.MODE === 'production' ? '/service-worker.js' : '/dev-sw.js?dev-sw';
      await navigator.serviceWorker.register(sw, { scope: '/' });
      await navigator.serviceWorker.ready;

      if (navigator.serviceWorker.controller) {
        // console.log('Service worker is controlling the page');
        sessionStorage.removeItem('cold-start');
        return;
      }

      // console.log('Service worker is NOT controlling the page');

      const coldStarted = sessionStorage.getItem('cold-start');
      if (!coldStarted) {
        // console.log('Cold-start, so reloading');
        sessionStorage.setItem('cold-start', 'true');
        window.location.reload();
      }
    } catch (err) {
      console.error('Service Worker Registration failed:', err);
    }
  })();
}
