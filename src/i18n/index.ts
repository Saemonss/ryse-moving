/*
 * Système de traduction maison.
 * - fr.ts est la langue source : il définit toutes les clés.
 * - nl.ts doit avoir exactement les mêmes clés (sinon TypeScript refuse de compiler).
 * - Dans un composant : const { t } = useI18n();  t('shell.reset')  ou  t('chauffeur.hello', { name: 'Karim' }).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fr } from './fr'
import { nl } from './nl'

export type Lang = 'fr' | 'nl'

/** Même forme que fr.ts, avec des textes (string) aux feuilles. */
export type Dictionary = DeepStrings<typeof fr>
type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> }

/** Toutes les clés possibles, sous forme « section.cle ». */
export type TKey = Paths<typeof fr>
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`
}[keyof T & string]

const dictionaries: Record<Lang, Dictionary> = { fr, nl }

export const LOCALES: Record<Lang, string> = { fr: 'fr-BE', nl: 'nl-BE' }

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let node: unknown = dictionaries[lang]
  for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part]
  if (typeof node !== 'string') return key
  if (!vars) return node
  return node.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m))
}

interface LangState {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'fr',
      setLang: (lang) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === 'fr' ? 'nl' : 'fr' }),
    }),
    { name: 'ryse-moving-lang' },
  ),
)

export function useI18n() {
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const toggleLang = useLangStore((s) => s.toggleLang)
  const t = (key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars)
  return { lang, locale: LOCALES[lang], t, setLang, toggleLang }
}
