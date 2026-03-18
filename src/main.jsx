import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ── Mount React ────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// ── Register Service Worker (production only) ──────────────────────────────
// vite-plugin-pwa auto-injects the SW registration in production builds.
// This manual fallback handles cases where the plugin isn't used.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err))
  })
}
