import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Corkboard } from './Corkboard'
import { Gate } from './Gate'
import './events.css'

const root = document.getElementById('events-root')
if (!root) throw new Error('events-root element not found')

createRoot(root).render(
  <StrictMode>
    <Gate>
      <Corkboard />
    </Gate>
  </StrictMode>,
)
