/*
 * Gérant › Planning : le même planning que le planificateur, en lecture. Clic sur un dossier → sa fiche.
 */
import { useI18n } from '../../i18n'
import { go } from '../../app/router'
import { PageHeader } from '../shared/Page'
import { Planning } from '../shared/planning/Planning'

export function GerantPlanning() {
  const { t } = useI18n()
  return (
    <>
      <PageHeader title={t('planning.title')} subtitle={t('planning.readOnly')} />
      <Planning onOpenMove={(id) => go('gerant', 'dossier', id)} />
    </>
  )
}
