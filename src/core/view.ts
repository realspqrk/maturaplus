import { labelFor, variables, type Category } from './catalog'
import { formatValue } from './format'
import { solve, type Solution } from './solver'

export type KpiState = 'entered' | 'derived' | 'conflict' | 'locked'

export interface KpiView {
  id: string
  state: KpiState
  value?: number
  /** inputs still needed to unlock (locked only) */
  missing: string[]
  /** inputs this value was calculated from (derived only) */
  from: string[]
  formula?: string
}

export interface CategoryView {
  solution: Solution
  kpis: Record<string, KpiView>
  conflicts: string[]
  invalid: Record<string, string>
  unlocked: number
  total: number
}

export function renderFormula(category: Category, formula: string): string {
  return formula.replace(/\{(\w+)\}/g, (_, id: string) => labelFor(category, id))
}

export function buildView(category: Category, inputs: Record<string, number>): CategoryView {
  const solution = solve(inputs, category.relations, variables)
  const kpis: Record<string, KpiView> = {}
  const ids = category.kpiGroups.flatMap((g) => g.kpis)

  for (const id of ids) {
    const r = solution.values[id]
    if (!r) {
      kpis[id] = { id, state: 'locked', missing: cheapestMissing(category.hints[id] ?? [], solution), from: [] }
      continue
    }
    const state: KpiState = r.status === 'conflict' ? 'conflict' : r.source === 'input' ? 'entered' : 'derived'
    kpis[id] = { id, state, value: r.value, missing: [], from: r.from ?? [], formula: r.formula }
  }

  const conflicts = solution.conflicts.map((c) => {
    const unit = variables[c.output].unit
    return `${labelFor(category, c.output)} is ${formatValue(c.actual, unit)}, but ${renderFormula(category, c.formula).split(' = ')[1]} gives ${formatValue(c.expected, unit)}.`
  })

  return {
    solution, kpis, conflicts, invalid: solution.invalid,
    unlocked: ids.filter((id) => kpis[id].state !== 'locked').length,
    total: ids.length,
  }
}

function cheapestMissing(hints: string[][], solution: Solution): string[] {
  let best: string[] | undefined
  for (const set of hints) {
    const missing = set.filter((id) => !solution.values[id])
    if (!best || missing.length < best.length) best = missing
  }
  return best ?? []
}
