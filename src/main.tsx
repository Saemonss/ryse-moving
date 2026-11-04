// Point d'entrée : charge la charte (police + couleurs) puis l'application.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import { Logo } from './ui/Logo'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="flex min-h-dvh items-center justify-center gap-10">
      <div className="rounded-2xl bg-white p-10"><Logo size="lg" /></div>
      <div className="rounded-2xl bg-ink p-10"><Logo size="lg" variant="dark" /></div>
    </div>
  </StrictMode>,
)
