/*
 * Rapport lisible de `npm run check` : ✓ ou ✗ par écran, avec la liste des éléments en échec.
 */
import { basename } from 'node:path'
import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

export default class CheckReporter implements Reporter {
  private rows: { file: string; title: string; ok: boolean; checked?: string; details: string[] }[] = []

  onTestEnd(test: TestCase, result: TestResult) {
    const ok = result.status === 'passed'
    const failures = test.annotations.filter((a) => a.type === 'failure').map((a) => a.description ?? '')
    const checked = test.annotations.find((a) => a.type === 'checked')?.description
    const details = failures.length ? failures : ok ? [] : [(result.error?.message ?? 'échec').split('\n').slice(0, 6).join('\n      ')]
    this.rows.push({ file: basename(test.location.file), title: test.title, ok, checked, details })
  }

  onError(error: { message?: string }) {
    console.log(`${RED}Erreur de lancement : ${error.message ?? ''}${RESET}`)
  }

  onEnd(result: FullResult) {
    const groups: Record<string, string> = {
      'crawl.spec.ts': 'Zéro bouton mort (chaque vue × chaque langue)',
      'journey.spec.ts': 'Parcours complet + réinitialisation',
      'robustness.spec.ts': 'Robustesse et raccourcis',
      'planning.spec.ts': 'Planning : situations risquées',
      'logic.spec.ts': 'Logique métier (sans navigateur)',
    }
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(' RySe Moving · rapport de vérification')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    for (const [file, label] of Object.entries(groups)) {
      const rows = this.rows.filter((r) => r.file === file).sort((a, b) => a.title.localeCompare(b.title))
      if (!rows.length) continue
      console.log(`\n ${label}`)
      for (const r of rows) {
        const count = r.checked ? `${DIM} (${r.checked} éléments cliqués)${RESET}` : ''
        console.log(`   ${r.ok ? `${GREEN}✓` : `${RED}✗`} ${r.title}${RESET}${count}`)
        for (const d of r.details) console.log(`      ${RED}- ${d}${RESET}`)
      }
    }
    const failed = this.rows.filter((r) => !r.ok).length
    const green = failed === 0 && this.rows.length > 0 && result.status === 'passed'
    console.log(`\n ${green ? `${GREEN}TOUT EST VERT` : `${RED}PAS VERT : ${failed} test(s) en échec`}${RESET} · ${this.rows.length} tests · ${result.status}\n`)
  }
}
