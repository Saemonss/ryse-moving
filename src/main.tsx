// Point d'entrée : charge la charte (police + couleurs) puis la coque de l'application.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import { App } from './app/App'
import { SafetyNet } from './app/SafetyNet'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SafetyNet>
      <App />
    </SafetyNet>
  </StrictMode>,
)
