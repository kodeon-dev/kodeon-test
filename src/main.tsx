import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/core.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  (async () => {
    try {
      const sw = import.meta.env.MODE === 'production' ? '/service-worker.js' : '/dev-sw.js?dev-sw'
      const registration = await navigator.serviceWorker.register(sw, { scope: '/' });
      console.log('Service Worker Registered with scope:', registration.scope);
      console.log('Service Worker', await navigator.serviceWorker.ready);
      console.log('Service Worker', registration);

      if (navigator.serviceWorker.controller) {
        console.log('Service worker is controlling the page');
      } else {
        console.log('Service worker is NOT controlling the page');

        setTimeout(function wait() {
          if (navigator.serviceWorker.controller) {
            console.log('Service worker is controlling the page');
          } else {
            console.log('Service worker is NOT controlling the page');
            setTimeout(wait, 1000)
          }
        }, 1000)
      }
    } catch (err) {
      console.error('Service Worker Registration failed:', err);
    }
  })()
}
