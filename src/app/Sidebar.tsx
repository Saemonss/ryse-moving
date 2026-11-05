/*
 * Barre latérale sombre des vues bureau : logo, menu de la vue, utilisateur fictif en bas.
 * Seules les entrées qui fonctionnent (ready) sont affichées.
 */
import { useI18n } from '../i18n'
import { Logo } from '../ui/Logo'
import { Avatar } from '../ui/Avatar'
import { useViewUser } from './shellState'
import { readyScreens, type ViewId } from './views'
import { go, hrefOf } from './router'

/** La fiche dossier dépend de l'entrée « Déménagements » du menu. */
const PARENT: Record<string, string> = { dossier: 'demenagements', journee: 'accueil', litige: 'accueil', demande: 'demandes' }

export function Sidebar({ view, screen }: { view: ViewId; screen: string }) {
  const { t } = useI18n()
  const user = useViewUser(view)
  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col bg-ink text-white md:flex">
      <div className="flex h-16 items-center px-5">
        <Logo variant="dark" size="sm" />
      </div>
      <nav aria-label={t('shell.mainNav')} className="flex-1 space-y-0.5 px-3 pt-4">
        {readyScreens(view)
          .filter((s) => s.menu)
          .map((s) => {
            const active = s.id === screen || PARENT[screen] === s.id
            const Icon = s.icon
            return (
              <a
                key={s.id}
                href={hrefOf(view, s.id)}
                onClick={(e) => {
                  e.preventDefault()
                  go(view, s.id)
                }}
                aria-current={s.id === screen ? 'page' : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors duration-150 ${
                  active ? 'bg-white/[0.09] text-white' : 'text-white/65 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <Icon size={18} aria-hidden="true" className={active ? 'text-accent-on-dark' : ''} />
                {t(s.label)}
              </a>
            )
          })}
      </nav>
      <div className="flex items-center gap-3 border-t border-ink-line px-5 py-4">
        <Avatar name={user.name} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-[13px] text-white/60">{user.role}</p>
        </div>
      </div>
    </aside>
  )
}
