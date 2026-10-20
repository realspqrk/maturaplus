import type { Unit } from './format'
import { boundsError, type Relation, type Variable } from './model'

export type Status = 'ok' | 'conflict'

export interface Resolved {
  value: number
  source: 'input' | 'derived'
  status: Status
  /** variables this value was computed from (derived only) */
  from?: string[]
  formula?: string
}

export interface Conflict {
  formula: string
  variables: string[]
  expected: number
  actual: number
  output: string
}

export interface Solution {
  values: Record<string, Resolved>
  conflicts: Conflict[]
  /** derived values rejected because they violate the variable's bounds */
  invalid: Record<string, string>
}

const ATOL: Record<Unit, number> = {
  currency: 0.005, percent: 0.005, count: 0.5, ratio: 0.005, points: 0.05, number: 0.005,
}
const RTOL = 0.01

export function approxEqual(a: number, b: number, unit: Unit): boolean {
  return Math.abs(a - b) <= ATOL[unit] + RTOL * Math.max(Math.abs(a), Math.abs(b))
}

/**
 * Forward-propagates entered values through directed relations until nothing new can be derived,
 * then checks every equation whose operands are all known for consistency.
 * Pure: always recomputed from the current inputs, so nothing stale can self-support.
 */
export function solve(
  inputs: Record<string, number>,
  relations: Relation[],
  variables: Record<string, Variable>,
): Solution {
  const values: Record<string, Resolved> = {}
  const invalid: Record<string, string> = {}

  // deterministic: iterate inputs in catalog order, not insertion order
  for (const id of Object.keys(inputs).sort()) {
    if (Number.isFinite(inputs[id])) values[id] = { value: inputs[id], source: 'input', status: 'ok' }
  }

  let changed = true
  while (changed) {
    changed = false
    for (const rel of relations) {
      if (values[rel.output] || !rel.inputs.every((i) => values[i])) continue
      const result = rel.compute(...rel.inputs.map((i) => values[i].value))
      if (result === undefined || !Number.isFinite(result)) continue
      const variable = variables[rel.output]
      const err = variable && boundsError(variable, result)
      if (err) {
        invalid[rel.output] ??= err
        continue
      }
      delete invalid[rel.output]
      values[rel.output] = { value: result, source: 'derived', status: 'ok', from: rel.inputs, formula: rel.formula }
      changed = true
    }
  }

  const conflicts: Conflict[] = []
  const checked = new Set<string>()
  for (const rel of relations) {
    if (checked.has(rel.equation)) continue
    const out = values[rel.output]
    if (!out || !rel.inputs.every((i) => values[i])) continue
    // a value derived by this exact relation is trivially consistent with it
    if (out.source === 'derived' && out.formula === rel.formula && sameInputs(out.from, rel.inputs)) continue
    checked.add(rel.equation)
    const expected = rel.compute(...rel.inputs.map((i) => values[i].value))
    if (expected === undefined || !Number.isFinite(expected)) continue
    const unit = variables[rel.output]?.unit ?? 'number'
    if (approxEqual(expected, out.value, unit)) continue
    const participants = [rel.output, ...rel.inputs]
    conflicts.push({ formula: rel.formula, variables: participants, expected, actual: out.value, output: rel.output })
    for (const p of participants) values[p].status = 'conflict'
  }

  // taint values computed from conflicting ones (insertion order is topological)
  for (const r of Object.values(values)) {
    if (r.source === 'derived' && r.from?.some((f) => values[f].status === 'conflict')) r.status = 'conflict'
  }

  return { values, conflicts, invalid }
}

function sameInputs(a: string[] | undefined, b: string[]) {
  return !!a && a.length === b.length && a.every((x, i) => x === b[i])
}
