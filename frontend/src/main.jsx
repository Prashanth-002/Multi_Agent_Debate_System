import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'

// Replace with your Clerk publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  // Graceful fallback for local development without key configured yet
  console.warn("Clerk Publishable Key is missing! Set VITE_CLERK_PUBLISHABLE_KEY.");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
