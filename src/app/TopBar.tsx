/*
 * Barre du haut, toujours visible : sélecteur « Voir en tant que… », langue FR/NL, menu présentateur.
 * Sur les vues téléphone (pas de barre latérale), le logo s'affiche ici.
 */
import { useEffect, useRef, useState } from 'react'
import { FlaskConical, RotateCcw, Settings } from 'lucide-react'
import { useI18n, type Lang } from '../i18n'
import { Logo } from '../ui/Logo'
import { go, type Route } from './router'

type ActiveView = Route['view']
import { VIEWS } from './views'
import { useShell } from './shellState'

export function TopBar({ route, showLogo }: { route: ActiveView; showLogo: boolean }) {
  const { t } = useI18n()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-line bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:px-6">
      {showLogo && <Logo size="sm" className="mr-2 hidden md:inline-flex" />}
      <nav aria-label={t('shell.viewAs')} className="flex min-w-0 items-center gap-3">
        <span className="hidden whitespace-nowrap text-sm text-muted 2xl:inline">{t('shell.viewAs')}</span>
        <ViewSwitcher route={route} />
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <DemoBadge />
        <LangSwitch />
        <PresenterMenu />
      </div>
    </header>
  )
}

function ViewSwitcher({ route }: { route: ActiveView }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-surface p-1">
      {VIEWS.map((v) => {
        const active = v.id === route
        const Icon = v.icon
        return (
          <a
            key={v.id}
            href={`#/${v.id}`}
            onClick={(e) => {
              e.preventDefault()
              go(v.id)
            }}
            aria-current={active ? 'page' : undefined}
            aria-label={t(`views.${v.id}`)}
            title={`${t(`views.${v.id}`)} (${v.key})`}
            className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 xl:px-3 ${
              active ? 'bg-white text-ink shadow-card' : 'text-muted hover:bg-white/60 hover:text-ink'
            }`}
          >
            <Icon size={17} aria-hidden="true" className={active ? 'text-accent' : ''} />
            <span className="hidden xl:inline">{t(`views.${v.id}`)}</span>
          </a>
        )
      })}
    </div>
  )
}

/** Bandeau discret et permanent : rappelle que tout est fictif. */
function DemoBadge() {
  const { t } = useI18n()
  return (
    <p
      data-demo-banner
      title={t('shell.demoBadge')}
      className="mr-1 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-[13px] font-medium text-muted"
    >
      <FlaskConical size={14} aria-hidden="true" className="text-accent" />
      <span className="hidden min-[1360px]:inline">{t('shell.demoBadge')}</span>
      <span className="min-[1360px]:hidden">{t('shell.demoShort')}</span>
    </p>
  )
}

function LangSwitch() {
  const { t, lang, setLang } = useI18n()
  const langs: Lang[] = ['fr', 'nl']
  return (
    <div role="group" aria-label={t('shell.language')} className="flex rounded-xl bg-surface p-1">
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`h-8 rounded-lg px-2.5 text-[13px] font-semibold uppercase tracking-wide transition-[background-color,color] duration-150 ${
            lang === l ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function PresenterMenu() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const setResetOpen = useShell((s) => s.setResetOpen)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const shortcuts: [string, string][] = [
    ['1 – 6', t('shell.shortcutViews')],
    ['L', t('shell.shortcutLang')],
    [t('shell.keyReset'), t('shell.shortcutReset')],
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('shell.presenterMenu')}
        title={t('shell.presenterMenu')}
        onClick={() => setOpen((o) => !o)}
        className={`grid size-10 place-items-center rounded-xl text-muted transition-[background-color,color] duration-150 hover:bg-surface hover:text-ink ${open ? 'bg-surface text-ink' : ''}`}
      >
        <Settings size={19} aria-hidden="true" className={`transition-transform duration-200 ease-out ${open ? 'rotate-45' : ''}`} />
      </button>
      {open && (
        <div
          data-popover
          className="absolute right-0 top-12 z-40 w-80 origin-top-right rounded-2xl border border-line bg-white p-2 shadow-float animate-[rm-scale-in_160ms_var(--ease-out)]"
        >
          <p className="px-3 pb-1 pt-2 text-[13px] font-medium text-muted">{t('shell.presenterMenu')}</p>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setResetOpen(true)
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-ink transition-colors hover:bg-surface"
          >
            <RotateCcw size={18} aria-hidden="true" className="text-accent" />
            {t('shell.reset')}
          </button>
          <div className="mt-1 border-t border-line px-3 pb-2 pt-3">
            <p className="mb-2 text-[13px] font-medium text-muted">{t('shell.shortcuts')}</p>
            <dl className="space-y-1.5 text-sm">
              {shortcuts.map(([keys, label]) => (
                <div key={keys} className="flex items-center justify-between gap-3">
                  <dt className="text-ink">{label}</dt>
                  <dd>
                    <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-xs font-semibold text-ink">{keys}</kbd>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
