// Point d'entrée : charge la charte (police + couleurs) puis l'application.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import { CharteView } from './views/charte/CharteView'
import { Toaster } from './ui/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CharteView />
    <Toaster />
  </StrictMode>,
)
