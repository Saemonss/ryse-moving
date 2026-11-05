/*
 * PDF du devis aux couleurs de RySe Moving (pdf-lib), dans la langue du client, avec la mention
 * « Document de démonstration ». Police Inter Tight embarquée (fichier local) ; si elle ne peut pas être
 * embarquée, repli sur la police standard du PDF (aucun appel réseau dans les deux cas).
 * pdf-lib est chargé seulement au moment de créer un PDF (le reste de la démo reste léger).
 */
import { translate, type TKey } from '../i18n'
import { fmtDate, fmtMoney, fmtNumber } from '../i18n/format'
import { cityLabel } from '../data/leads'
import { quoteDeposit, quoteTotal } from '../data/quote'
import type { Customer, Lead, Move } from '../data/types'

const INK = [11 / 255, 16 / 255, 38 / 255] as const
/** Ramène le texte aux caractères des polices standard du PDF (WinAnsi) : espaces fines, flèches… */
export const pdfSafe = (s: string) =>
  s
    .replace(/[   ]/g, ' ')
    .replace(/[→➔]/g, '>')
    .replace(/[‐-–]/g, '-')
    .replace(/[^ -~ -ÿ€—‘’“”•…Œœ]/g, '')

const ACCENT = [91 / 255, 59 / 255, 234 / 255] as const
const MUTED = [93 / 255, 98 / 255, 134 / 255] as const

export async function quotePdfUrl(lead: Lead, move: Move, customer: Customer | undefined, today: string): Promise<string> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const l = lead.lang
  const t = (k: TKey, v?: Record<string, string | number>) => translate(l, k, v)
  const q = lead.quote!
  const doc = await PDFDocument.create()
  doc.setTitle(`${t('pdf.title')} ${move.ref}`)
  doc.setProducer('RySe Moving (démo)')

  // Polices standard du PDF (aucun fichier à charger) : la police variable Inter Tight ne se découpe pas dans pdf-lib
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const page = doc.addPage([595.28, 841.89]) // A4
  const ink = rgb(...INK)
  const accent = rgb(...ACCENT)
  const muted = rgb(...MUTED)
  const text = (s: string, x: number, y: number, size = 10, color = ink, f = font) => page.drawText(pdfSafe(s), { x, y, size, font: f, color })
  const right = (s: string, xr: number, y: number, size = 10, color = ink, f = font) => text(s, xr - f.widthOfTextAtSize(pdfSafe(s), size), y, size, color, f)

  // En-tête : 3 barres montantes + RySe Moving
  page.drawRectangle({ x: 48, y: 781, width: 7, height: 10, color: rgb(211 / 255, 204 / 255, 247 / 255) })
  page.drawRectangle({ x: 58, y: 781, width: 7, height: 17, color: rgb(156 / 255, 133 / 255, 1) })
  page.drawRectangle({ x: 68, y: 781, width: 7, height: 24, color: accent })
  text('RySe', 84, 783, 20, ink, bold)
  text('Moving', 84 + bold.widthOfTextAtSize('RySe ', 20), 783, 20, accent)
  right(t('pdf.ref', { ref: move.ref }), 547, 795, 11, ink, bold)
  right(t('pdf.date', { date: fmtDate(today, l, 'medium') }), 547, 780, 10, muted)

  // Bandeau démonstration
  page.drawRectangle({ x: 48, y: 744, width: 499, height: 22, color: rgb(244 / 255, 243 / 255, 251 / 255) })
  text(t('pdf.demo'), 58, 751, 9.5, accent)

  text(t('pdf.title'), 48, 708, 22, ink, bold)

  // Client et déménagement
  text(t('pdf.client'), 48, 680, 9, muted)
  text(customer?.name ?? lead.name, 48, 666, 11)
  text(t('pdf.move'), 300, 680, 9, muted)
  const rows: [string, string][] = [
    [t('pdf.from'), `${move.from.street} ${move.from.number}, ${move.from.postcode} ${cityLabel(move.from.cityId, l)}`],
    [t('pdf.to'), move.to ? `${move.to.street} ${move.to.number}, ${move.to.postcode} ${cityLabel(move.to.cityId, l)}` : '—'],
    [t('pdf.when'), fmtDate(move.date, l, 'long')],
    [t('pdf.volume'), `${fmtNumber(move.volumeM3, l)} m³`],
  ]
  rows.forEach(([k, v], i) => {
    text(k, 300, 666 - i * 15, 9, muted)
    text(v, 380, 666 - i * 15, 9.5)
  })

  // Tableau des lignes
  let y = 580
  page.drawLine({ start: { x: 48, y: y + 14 }, end: { x: 547, y: y + 14 }, thickness: 0.6, color: muted })
  text(t('pdf.line'), 48, y, 9, muted)
  right(t('pdf.qty'), 360, y, 9, muted)
  right(t('pdf.unit'), 455, y, 9, muted)
  right(t('pdf.amount'), 547, y, 9, muted)
  y -= 8
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 0.6, color: muted })
  for (const line of q.lines) {
    y -= 18
    text(t(`quote.lines.${line.kind}`), 48, y, 10)
    right(fmtNumber(line.qty, l), 360, y, 10)
    right(fmtMoney(line.unitCents, l), 455, y, 10)
    right(fmtMoney(line.qty * line.unitCents, l), 547, y, 10)
  }
  y -= 14
  page.drawLine({ start: { x: 300, y }, end: { x: 547, y }, thickness: 0.6, color: muted })
  y -= 20
  text(t('pdf.total'), 300, y, 12, ink, bold)
  right(fmtMoney(quoteTotal(q), l), 547, y, 12, ink, bold)
  y -= 18
  text(t('pdf.deposit', { pct: q.depositPct }), 300, y, 10, muted)
  right(fmtMoney(quoteDeposit(q), l), 547, y, 10, muted)

  text(t('pdf.validity'), 48, 190, 9, muted)
  page.drawRectangle({ x: 300, y: 92, width: 247, height: 80, borderColor: muted, borderWidth: 0.6 })
  text(t('pdf.signature'), 308, 160, 9, muted)
  text(t('pdf.footer'), 48, 48, 8, muted)

  const bytes = await doc.save()
  return URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
}
