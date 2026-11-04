/*
 * Coque de l'application : choisit la mise en page (bureau avec barre latérale, ou cadre de téléphone)
 * selon la vue, et affiche les éléments permanents (bandeau démo, messages, fenêtre de réinitialisation).
 */
import { useEffect } from 'react'
import { useI18n } from '../i18n'
import { useDemo, watchDayChange } from '../store/demoStore'
import { Toaster, toast } from '../ui/Toast'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { CharteView } from '../views/charte/CharteView'
import { GerantHome } from '../views/gerant/GerantHome'
import { MovesList } from '../views/gerant/MovesList'
import { MoveFile } from '../views/gerant/MoveFile'
import { GerantPlanning } from '../views/gerant/PlanningScreen'
import { TeamScreen } from '../views/gerant/TeamScreen'
import { FleetScreen } from '../views/gerant/FleetScreen'
import { ProfitScreen } from '../views/gerant/ProfitScreen'
import { SettingsScreen } from '../views/gerant/SettingsScreen'
import { DayReview } from '../views/gerant/DayReview'
import { ClaimScreen } from '../views/gerant/ClaimScreen'
import { PlanificateurPlanning } from '../views/planificateur/PlanningScreen'
import { AbsencesScreen } from '../views/planificateur/AbsencesScreen'
import { ToPlanScreen } from '../views/planificateur/ToPlanScreen'
import { ChauffeurApp } from '../views/chauffeur/ChauffeurApp'
import { CommercialHome } from '../views/commercial/CommercialHome'
import { ClientHome } from '../views/client/ClientHome'
import { ComptabiliteHome } from '../views/comptabilite/ComptabiliteHome'
import { normalizeHash, useRoute, type Route } from './router'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { PhoneFrame } from './PhoneFrame'
import { useShell, useViewUser } from './shellState'
import { useShortcuts } from './useShortcuts'
import { viewDef, type ViewId } from './views'

type Screen = (props: { param?: string }) => React.JSX.Element

/** Composant de chaque écran : SCREENS[vue][ecran]. Les écrans pas encore prêts n'y figurent pas. */
const SCREENS: Record<ViewId, Record<string, Screen>> = {
  gerant: {
    accueil: GerantHome,
    demenagements: MovesList,
    dossier: MoveFile,
    planning: GerantPlanning,
    equipe: TeamScreen,
    flotte: FleetScreen,
    rentabilite: ProfitScreen,
    parametres: SettingsScreen,
    journee: DayReview,
    litige: ClaimScreen,
  },
  planificateur: { planning: PlanificateurPlanning, absences: AbsencesScreen, 'a-planifier': ToPlanScreen },
  chauffeur: { accueil: ChauffeurApp },
  commercial: { accueil: CommercialHome },
  client: { accueil: ClientHome },
  comptabilite: { accueil: ComptabiliteHome },
}

export function App() {
  const route = useRoute()
  const { lang } = useI18n()
  useShortcuts()

  useEffect(() => watchDayChange(), [])
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
      {route.view === 'charte' ? (
        <div className="min-h-dvh">
          <TopBar route={route.view} showLogo />
          <main id="main">
            <CharteView />
          </main>
        </div>
      ) : (
        <ViewLayout route={route as Route & { view: ViewId }} />
      )}
      <ResetDialog />
      {!(route.view !== 'charte' && viewDef(route.view).layout === 'phone') && <Toaster />}
    </>
  )
}

function ViewLayout({ route }: { route: Route & { view: ViewId } }) {
  const { t } = useI18n()
  const { view, screen, param } = route
  const user = useViewUser(view)
  const Screen = SCREENS[view][screen] ?? Object.values(SCREENS[view])[0]!
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
            <Screen param={param} />
          </PhoneFrame>
        </main>
      </div>
    )

  return (
    <div className="flex min-h-dvh">
      <Sidebar view={view} screen={screen} />
      <div className="min-w-0 flex-1">
        <TopBar route={view} showLogo={false} />
        <main id="main" key={`${view}/${screen}/${param ?? ''}`} className="mx-auto max-w-[1240px] px-6 pb-20 pt-8 lg:px-10">
          <Screen param={param} />
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
