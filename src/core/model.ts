import type { Unit } from './format'

export interface Variable {
  id: string
  label: string
  unit: Unit
  /** inclusive bounds; values outside are rejected (input) or reported invalid (derived) */
  min?: number
  max?: number
  /** plain-English explanation shown in the help popover */
  help?: string
}

export interface Relation {
  output: string
  inputs: string[]
  compute: (...args: number[]) => number | undefined
  /** human formula with {variableId} placeholders, e.g. "{cpm} = {spend} ÷ {impressions} × 1000" */
  formula: string
  /** directed relations generated from the same equation share an id */
  equation: string
}

const div = (a: number, b: number) => (b === 0 ? undefined : a / b)

export function relation(
  output: string,
  inputs: string[],
  compute: Relation['compute'],
  formula: string,
  equation = formula,
): Relation {
  return { output, inputs, compute, formula, equation }
}

/** out = num / den × scale, plus both inverses (each with its own directed formula). */
export function ratio(out: string, num: string, den: string, scale = 1): Relation[] {
  const times = scale === 1 ? '' : ` × ${scale}`
  const per = scale === 1 ? '' : ` ÷ ${scale}`
  const equation = `{${out}} = {${num}} ÷ {${den}}${times}`
  return [
    relation(out, [num, den], (n, d) => mapDef(div(n, d), (x) => x * scale), equation, equation),
    relation(num, [out, den], (o, d) => (o * d) / scale, `{${num}} = {${out}} × {${den}}${per}`, equation),
    relation(den, [num, out], (n, o) => mapDef(div(n, o), (x) => x * scale), `{${den}} = {${num}} ÷ {${out}}${times}`, equation),
  ]
}

/** out = a × b ÷ divisor, plus both inverses (each with its own directed formula). */
export function product(out: string, a: string, b: string, divisor = 1): Relation[] {
  const per = divisor === 1 ? '' : ` ÷ ${divisor}`
  const times = divisor === 1 ? '' : ` × ${divisor}`
  const equation = `{${out}} = {${a}} × {${b}}${per}`
  return [
    relation(out, [a, b], (x, y) => (x * y) / divisor, equation, equation),
    relation(a, [out, b], (o, y) => mapDef(div(o, y), (x) => x * divisor), `{${a}} = {${out}} ÷ {${b}}${times}`, equation),
    relation(b, [out, a], (o, x) => mapDef(div(o, x), (y) => y * divisor), `{${b}} = {${out}} ÷ {${a}}${times}`, equation),
  ]
}

function mapDef(x: number | undefined, f: (x: number) => number) {
  return x === undefined ? undefined : f(x)
}

export function boundsError(v: Variable, value: number): string | undefined {
  if (v.min !== undefined && value < v.min) return `${v.label} can't be less than ${v.min}.`
  if (v.max !== undefined && value > v.max) return `${v.label} can't exceed ${v.max}${v.unit === 'percent' ? '%' : ''}.`
  return undefined
}
