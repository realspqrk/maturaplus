export type Unit = 'currency' | 'percent' | 'count' | 'ratio' | 'points' | 'number'

const NUMBER_RE = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i
const GROUPED = /^-?\d{1,3}(\.\d{3})+/

/**
 * Parse user input in German notation: comma = decimal, dot = thousands (1.234,56).
 * A lone dot that isn't a thousands group (2.4) is read as a decimal point, as students often type it.
 * Spaces, € and % are tolerated.
 */
export function parseNumber(raw: string): number | undefined {
  // optional leading sign, € before or after, optional trailing %; symbols anywhere else are invalid
  const m = /^(-?)\s*€?\s*([^€%]*?)\s*€?\s*%?$/.exec(raw.trim())
  // € may lead or trail, but only once
  if (!m || raw.split('€').length > 2) return undefined
  let s = (m[1] + m[2]).replace(/\s/g, '')
  if (s.includes(',')) {
    // 1234,5, 1.234,5 or ,5: dots only as thousands groups, a single decimal comma
    if (!/^-?(\d+|\d{1,3}(\.\d{3})+)?(,\d*)?$/.test(s)) return undefined
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (new RegExp(`${GROUPED.source}$`).test(s)) {
    s = s.replace(/\./g, '') // 1.500 = 1500
  }
  if (!NUMBER_RE.test(s)) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat('de-DE', opts)
const NBSP = ' '

export function formatValue(value: number, unit: Unit): string {
  switch (unit) {
    case 'currency': {
      const abs = Math.abs(value)
      // keep 2 significant digits for sub-cent values (e.g. cost per contact)
      const opts: Intl.NumberFormatOptions =
        abs > 0 && abs < 0.01
          ? { maximumSignificantDigits: 2 }
          : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      return nf({ style: 'currency', currency: 'EUR', ...opts }).format(value)
    }
    case 'percent':
      return `${nf({ maximumFractionDigits: 2 }).format(value)}${NBSP}%`
    case 'count':
      return nf({ maximumFractionDigits: 0 }).format(value)
    case 'ratio':
      return `${nf({ maximumFractionDigits: 2 }).format(value)}×`
    case 'points':
      return nf({ maximumFractionDigits: 1 }).format(value)
    case 'number':
      return nf({ maximumFractionDigits: 2 }).format(value)
  }
}
