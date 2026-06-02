import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { VoiceCallProvider } from './contexts/VoiceCallContext'
import { CallingOverlay } from './components/chat/CallingOverlay'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VoiceCallProvider>
          <App />
          <CallingOverlay />
        </VoiceCallProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
