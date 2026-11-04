/*
 * Tableau simple et court. Colonnes déclarées une fois ; un message clair quand il n'y a aucune ligne.
 */
import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  className?: string
}

interface SimpleTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  empty: string
}

export function SimpleTable<T>({ columns, rows, rowKey, empty }: SimpleTableProps<T>) {
  if (rows.length === 0) return <p className="px-5 py-8 text-center text-[15px] text-muted">{empty}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`whitespace-nowrap px-5 py-2.5 text-[13px] font-medium text-muted ${c.className ?? ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line/70 last:border-0">
              {columns.map((c) => (
                <td key={c.key} className={`px-5 py-3 align-middle text-ink ${c.className ?? ''}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
