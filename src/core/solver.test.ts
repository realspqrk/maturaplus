import { describe, expect, it } from 'vitest'
import { product, ratio, relation, type Variable } from './model'
import { solve } from './solver'

const v = (id: string, unit: Variable['unit'] = 'number', extra: Partial<Variable> = {}): Variable => ({
  id, label: id, unit, min: 0, ...extra,
})
const vars = Object.fromEntries(
  [
    v('spend', 'currency'), v('impressions', 'count'), v('clicks', 'count'),
    v('cpm', 'currency'), v('cpc', 'currency'), v('ctr', 'percent', { max: 100 }),
    v('reach', 'percent', { max: 100 }), v('frequency', 'number', { min: 1 }), v('grp', 'points'),
  ].map((x) => [x.id, x]),
)
const relations = [
  ...ratio('cpm', 'spend', 'impressions', 1000),
  ...ratio('cpc', 'spend', 'clicks'),
  ...ratio('ctr', 'clicks', 'impressions', 100),
  ...product('grp', 'reach', 'frequency'),
]

describe('solve', () => {
  it('returns entered values unchanged as inputs', () => {
    const r = solve({ spend: 100 }, relations, vars)
    expect(r.values.spend).toMatchObject({ value: 100, source: 'input', status: 'ok' })
  })

  it('derives a direct KPI with provenance', () => {
    const r = solve({ spend: 5000, impressions: 1_000_000 }, relations, vars)
    expect(r.values.cpm).toMatchObject({ value: 5, source: 'derived', status: 'ok' })
    expect(r.values.cpm.from).toEqual(['spend', 'impressions'])
  })

  it('chains through inverse relations (spend + CPM -> impressions -> clicks via CTR -> CPC)', () => {
    const r = solve({ spend: 5000, cpm: 5, ctr: 0.5 }, relations, vars)
    expect(r.values.impressions.value).toBeCloseTo(1_000_000)
    expect(r.values.clicks.value).toBeCloseTo(5000)
    expect(r.values.cpc.value).toBeCloseTo(1)
  })

  it('is independent of the order in which inputs were entered', () => {
    const a = solve({ spend: 5000, cpm: 5, ctr: 0.5 }, relations, vars)
    const b = solve({ ctr: 0.5, cpm: 5, spend: 5000 }, relations, vars)
    expect(a.values).toEqual(b.values)
  })

  it('does not derive anything from an underdetermined system (GRP alone does not give reach)', () => {
    const r = solve({ grp: 100 }, relations, vars)
    expect(r.values.reach).toBeUndefined()
    expect(r.values.frequency).toBeUndefined()
  })

  it('skips division by zero instead of producing Infinity/NaN', () => {
    const r = solve({ spend: 0, cpm: 0 }, relations, vars)
    expect(r.values.impressions).toBeUndefined()
    const r2 = solve({ spend: 100, impressions: 0 }, relations, vars)
    expect(r2.values.cpm).toBeUndefined()
    for (const val of Object.values(r2.values)) expect(Number.isFinite(val.value)).toBe(true)
  })

  it('accepts redundant but consistent inputs (within rounding tolerance)', () => {
    const r = solve({ spend: 1000, impressions: 240_000, cpm: 4.17 }, relations, vars)
    expect(r.conflicts).toEqual([])
    expect(r.values.cpm.status).toBe('ok')
  })

  it('flags contradictory inputs and marks all participants as conflicting', () => {
    const r = solve({ spend: 1000, impressions: 100_000, cpm: 20 }, relations, vars)
    expect(r.conflicts).toHaveLength(1)
    expect(r.conflicts[0].variables.sort()).toEqual(['cpm', 'impressions', 'spend'])
    expect(r.values.cpm.status).toBe('conflict')
    expect(r.values.spend.status).toBe('conflict')
  })

  it('detects derived-vs-derived disagreement and taints downstream values', () => {
    // clicks via CPC = 1000; via CTR*impressions = 2000
    const r = solve({ spend: 1000, cpc: 1, impressions: 100_000, ctr: 2 }, relations, vars)
    expect(r.conflicts.length).toBeGreaterThan(0)
    expect(r.values.clicks.status).toBe('conflict')
    expect(r.values.cpm.status).toBe('conflict') // derived from conflicting spend/impressions
  })

  it('reports an invalid derived value that violates bounds and does not propagate it', () => {
    const r = solve({ grp: 300, frequency: 2 }, relations, vars) // reach 150 %
    expect(r.values.reach).toBeUndefined()
    expect(r.invalid.reach).toMatch(/100/)
  })

  it('reports frequency below 1 as invalid', () => {
    const r = solve({ grp: 30, reach: 60 }, relations, vars)
    expect(r.values.frequency).toBeUndefined()
    expect(r.invalid.frequency).toBeDefined()
  })

  it('ignores relations whose compute returns undefined', () => {
    const rel = relation('x', ['spend'], () => undefined, 'x = ?')
    const r = solve({ spend: 1 }, [rel], { ...vars, x: v('x') })
    expect(r.values.x).toBeUndefined()
  })
})
