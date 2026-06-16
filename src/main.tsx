import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './ui/theme.ts'
import { warmUpSolver } from './solver/cubejsBridge.ts'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Build the cubejs solver tables in the background so the first solve is instant.
warmUpSolver()
