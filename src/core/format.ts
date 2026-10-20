export type Unit = 'currency' | 'percent' | 'count' | 'ratio' | 'points' | 'number'

const NUMBER_RE = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i

/** Parse user input in English notation. Thousands separators, spaces, € and % are tolerated. */
export function parseNumber(raw: string): number | undefined {
  // optional leading sign and €, optional trailing %; symbols anywhere else are invalid
  const m = /^(-?)\s*€?\s*([^€%]*?)\s*%?$/.exec(raw.trim())
  if (!m) return undefined
  let s = (m[1] + m[2]).replace(/\s/g, '')
  if (/,/.test(s)) {
    // commas are only valid as thousands separators: 1,234 or 1,234,567.8
    if (!/^-?\d{1,3}(,\d{3})+(\.\d*)?$/.test(s)) return undefined
    s = s.replace(/,/g, '')
  }
  if (!NUMBER_RE.test(s)) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat('en-IE', opts)

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
      return `${nf({ maximumFractionDigits: 2 }).format(value)}%`
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
