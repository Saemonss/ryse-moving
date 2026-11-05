/*
 * Le téléphone du chauffeur : enchaîne les écrans selon l'état de sa journée.
 * connexion → début de journée (position) → contrôle du camion → missions ⇄ mission guidée → fin de journée → envoyée.
 * Sans réseau, un bandeau rassurant reste visible avec le nombre d'éléments en attente d'envoi.
 */
import { useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useI18n } from '../../i18n'
import { useDemo } from '../../store/demoStore'
import { LoginScreen } from './LoginScreen'
import { StartDay, VehicleCheck } from './DayStart'
import { MissionsScreen } from './MissionsScreen'
import { MissionFlow } from './MissionFlow'
import { DayEnd } from './DayEnd'
import { useDriver } from './useDriver'

export function ChauffeurApp() {
  const { session, day, today } = useDriver()
  // Clé : nouveau chauffeur, nouvelle journée ou réinitialisation → l'écran repart de zéro (aucun état périmé)
  return <PhoneApp key={`${session ?? '-'}|${day?.id ?? '-'}|${today}`} />
}

function PhoneApp() {
  const { session, day } = useDriver()
  const online = useDemo((s) => s.online)
  const pending = useDemo((s) => s.queue.length)
  const [open, setOpen] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)
  const banner = online ? undefined : <OfflineBanner pending={pending} />

  if (!session) return <LoginScreen />
  if (!day) return <StartDay banner={banner} />
  if (!day.check) return <VehicleCheck banner={banner} />
  if (day.status === 'started' && !ending) {
    if (open) return <MissionFlow moveId={open} onBack={() => setOpen(null)} banner={banner} />
    return <MissionsScreen banner={banner} onOpen={setOpen} onEnd={() => setEnding(true)} />
  }
  return <DayEnd banner={banner} onBack={day.status === 'started' ? () => setEnding(false) : undefined} />
}

function OfflineBanner({ pending }: { pending: number }) {
  const { t } = useI18n()
  return (
    <div role="status" data-offline className="sticky top-0 z-20 flex items-center gap-2 bg-warning px-5 py-2.5 text-[15px] font-semibold leading-snug text-white">
      <WifiOff size={20} className="shrink-0" aria-hidden="true" />
      <span className="flex-1">{t('terrain.offline.banner')}</span>
      {pending > 0 && <span className="tabular shrink-0 rounded-full bg-white/20 px-2 py-0.5">{t('terrain.offline.pending', { n: pending })}</span>}
    </div>
  )
}
