import { variables } from '../core/catalog'
import { formatValue, parseNumber } from '../core/format'
import { boundsError } from '../core/model'

export type RawInputs = Record<string, string>

export interface ParsedInputs {
  values: Record<string, number>
  errors: Record<string, string>
}

export function parseInputs(raw: RawInputs): ParsedInputs {
  const values: Record<string, number> = {}
  const errors: Record<string, string> = {}
  for (const [id, text] of Object.entries(raw)) {
    if (!text.trim()) continue
    const n = parseNumber(text)
    if (n === undefined) {
      errors[id] = 'Enter a number, e.g. 1,234.56'
      continue
    }
    const err = boundsError(variables[id], n)
    if (err) errors[id] = err
    else values[id] = n
  }
  return { values, errors }
}

/** Number without unit symbol, for placeholders next to a unit adornment. */
export function formatPlain(value: number, unit: Parameters<typeof formatValue>[1]): string {
  return formatValue(value, unit).replace(/[€%×]/g, '').trim()
}

const grouped = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 10 })

/** Show a valid entered number with thousands separators; leave anything else as typed. */
export function formatInput(raw: string): string {
  const n = parseNumber(raw)
  if (n === undefined) return raw
  const shown = grouped.format(n)
  // never display a value that differs from what is calculated with (e.g. 1e-11 would show as 0)
  return parseNumber(shown) === n ? shown : raw
}
