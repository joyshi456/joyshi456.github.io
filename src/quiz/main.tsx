import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Quiz } from './Quiz'
import './quiz.css'

const root = document.getElementById('quiz-root')
if (!root) throw new Error('quiz-root element not found')

createRoot(root).render(
  <StrictMode>
    <Quiz />
  </StrictMode>,
)
