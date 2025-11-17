// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // StrictMode deaktiviert, um doppelte Renders zu vermeiden
  // <StrictMode>
    <App />
  // </StrictMode>,
)
