import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  (async () => {
    try {
      const sw = import.meta.env.MODE === 'production' ? '/service-worker.js' : '/dev-sw.js?dev-sw'
      const registration = await navigator.serviceWorker.register(sw);
      console.log('Service Worker Registered with scope:', registration.scope);
    } catch (err) {
      console.error('Service Worker Registration failed:', err);
    }
  })()
}
