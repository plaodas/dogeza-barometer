import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { DebugLabProvider } from './context/DebugLabContext'
import { SettingsProvider } from './context/SettingsContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <DebugLabProvider>
        <App />
      </DebugLabProvider>
    </SettingsProvider>
  </StrictMode>,
)
