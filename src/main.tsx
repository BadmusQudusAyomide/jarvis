import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA (only in production and when supported)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use the sw.js at the root so it controls the whole scope
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('SW registration failed:', err))
  })
}
