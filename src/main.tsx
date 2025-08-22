import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA only in production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('SW registration failed:', err))
  })
} else if ('serviceWorker' in navigator) {
  // In dev, try to unregister any existing SW to avoid caching issues
  navigator.serviceWorker.getRegistrations?.().then((regs) => {
    regs.forEach((reg) => reg.unregister().catch(() => {}))
  })
}
