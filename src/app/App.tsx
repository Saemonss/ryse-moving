/*
 * Coque de l'application : choisit la mise en page (bureau avec barre latérale, ou cadre de téléphone)
 * selon la vue, et affiche les éléments permanents (bandeau démo, messages, fenêtre de réinitialisation).
 */
import { useEffect } from 'react'
import { useI18n } from '../i18n'
import { useDemo } from '../store/demoStore'
import { Toaster, toast } from '../ui/Toast'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { CharteView } from '../views/charte/CharteView'
import { GerantHome } from '../views/gerant/GerantHome'
import { PlanificateurHome } from '../views/planificateur/PlanificateurHome'
import { ChauffeurHome } from '../views/chauffeur/ChauffeurHome'
import { CommercialHome } from '../views/commercial/CommercialHome'
import { ClientHome } from '../views/client/ClientHome'
import { ComptabiliteHome } from '../views/comptabilite/ComptabiliteHome'
import { normalizeHash, useRoute } from './router'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { PhoneFrame } from './PhoneFrame'
import { useShell, useViewUser } from './shellState'
import { useShortcuts } from './useShortcuts'
import { viewDef, type ViewId } from './views'

const SCREENS: Record<ViewId, () => React.JSX.Element> = {
  gerant: GerantHome,
  planificateur: PlanificateurHome,
  chauffeur: ChauffeurHome,
  commercial: CommercialHome,
  client: ClientHome,
  comptabilite: ComptabiliteHome,
}

export function App() {
  const route = useRoute()
  const { lang } = useI18n()
  useShortcuts()

  useEffect(() => {
    normalizeHash()
    window.addEventListener('hashchange', normalizeHash)
    return () => window.removeEventListener('hashchange', normalizeHash)
  }, [])
  useEffect(() => {
    document.documentElement.lang = lang === 'nl' ? 'nl-BE' : 'fr-BE'
  }, [lang])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  return (
    <>
      {route === 'charte' ? (
        <div className="min-h-dvh">
          <TopBar route={route} showLogo />
          <main id="main">
            <CharteView />
          </main>
        </div>
      ) : (
        <ViewLayout view={route} />
      )}
      <ResetDialog />
      <Toaster />
    </>
  )
}

function ViewLayout({ view }: { view: ViewId }) {
  const { t } = useI18n()
  const user = useViewUser(view)
  const Screen = SCREENS[view]
  const phone = viewDef(view).layout === 'phone'

  if (phone)
    return (
      <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_70%_40%,#ebe7fb,transparent_70%)]">
        <TopBar route={view} showLogo />
        <main id="main" key={view}>
          <PhoneFrame
            caption={view === 'chauffeur' ? t('shell.phoneChauffeur') : t('shell.phoneClient')}
            hint={t('shell.phoneHint')}
            user={user}
          >
            <Screen />
          </PhoneFrame>
        </main>
      </div>
    )

  return (
    <div className="flex min-h-dvh">
      <Sidebar view={view} />
      <div className="min-w-0 flex-1">
        <TopBar route={view} showLogo={false} />
        <main id="main" key={view} className="mx-auto max-w-[1240px] px-6 pb-20 pt-8 lg:px-10">
          <Screen />
        </main>
      </div>
    </div>
  )
}

function ResetDialog() {
  const { t } = useI18n()
  const open = useShell((s) => s.resetOpen)
  const setOpen = useShell((s) => s.setResetOpen)
  const resetDemo = useDemo((s) => s.resetDemo)
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={t('shell.resetTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              resetDemo()
              setOpen(false)
              toast(t('shell.resetDone'))
            }}
          >
            {t('shell.resetConfirm')}
          </Button>
        </>
      }
    >
      <p>{t('shell.resetText')}</p>
    </Modal>
  )
}
