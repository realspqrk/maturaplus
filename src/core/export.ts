import { labelFor, variables, type Category } from './catalog'
import type { Unit } from './format'
import { buildView } from './view'
import { renderFormula } from './view'

const UNIT_LABEL: Record<Unit, string> = { currency: 'EUR', percent: '%', count: 'Anzahl', ratio: 'x', points: 'Punkte', number: '' }

/** RFC 4180 quoting (with `;` as separator, as German Excel expects) plus a guard against spreadsheet formula injection. */
export function csvField(value: string | number | undefined): string {
  if (value === undefined) return ''
  // decimal comma, no thousands separator: German Excel reads it as a number
  if (typeof value === 'number') return String(value).replace('.', ',')
  let s = value
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(category: Category, inputs: Record<string, number>): string {
  const view = buildView(category, inputs)
  const rows: (string | number | undefined)[][] = [['Kategorie', 'Gruppe', 'Kennzahl', 'Wert', 'Einheit', 'Status', 'Formel']]
  const inputIds = category.sections.flatMap((s) => [...s.primary, ...s.more])

  for (const id of inputIds) {
    if (!(id in inputs)) continue
    const status = view.solution.values[id]?.status === 'conflict' ? 'Konflikt' : 'eingegeben'
    rows.push([category.label, 'Eingaben', labelFor(category, id), inputs[id], UNIT_LABEL[variables[id].unit], status, ''])
  }
  for (const group of category.kpiGroups) {
    for (const id of group.kpis) {
      const k = view.kpis[id]
      const status = { entered: 'eingegeben', derived: 'berechnet', conflict: 'Konflikt', locked: 'fehlt' }[k.state]
      const formula = k.state === 'derived' && k.formula ? renderFormula(category, k.formula) : ''
      rows.push([category.label, group.title, labelFor(category, id), k.value, UNIT_LABEL[variables[id].unit], status, formula])
    }
  }
  for (const c of view.conflicts) rows.push([category.label, 'Konflikte', c, undefined, '', 'Konflikt', ''])
  for (const msg of Object.values(view.invalid)) rows.push([category.label, 'Warnungen', msg, undefined, '', 'ungültig', ''])

  return '﻿' + rows.map((r) => r.map(csvField).join(';')).join('\r\n') + '\r\n'
}
