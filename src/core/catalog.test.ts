import { describe, expect, it } from 'vitest'
import { categories, getCategory, variables } from './catalog'
import { solve } from './solver'

const run = (categoryId: string, inputs: Record<string, number>) => {
  const c = getCategory(categoryId)
  return solve(inputs, c.relations, variables)
}
const val = (r: ReturnType<typeof run>, id: string) => r.values[id]?.value

describe('online', () => {
  const r = run('online', { spend: 10_000, impressions: 2_000_000, clicks: 20_000, conversions: 400, revenue: 40_000, margin: 30, leads: 500, views: 300_000, reachPersons: 400_000 })
  it.each([
    ['cpm', 5], ['cpc', 0.5], ['ctr', 1], ['cvr', 2], ['cpa', 25], ['cpl', 20],
    ['cpv', 10_000 / 300_000], ['viewRate', 15], ['frequency', 5],
    ['revenuePerConversion', 100], ['roas', 4], ['contribution', 2_000], ['roi', 20], ['breakEvenRoas', 100 / 30],
  ])('%s', (id, expected) => {
    expect(val(r, id)).toBeCloseTo(expected as number, 6)
  })
  it('has no conflicts', () => expect(r.conflicts).toEqual([]))
})

describe('business outcome', () => {
  it('never computes ROI without a margin (no 100% margin fallback)', () => {
    const r = run('online', { spend: 200, revenue: 1_000 })
    expect(val(r, 'roas')).toBe(5)
    expect(r.values.roi).toBeUndefined()
    expect(r.values.contribution).toBeUndefined()
  })
  it('computes a negative ROI when the margin does not cover spend', () => {
    const r = run('tv', { spend: 200, revenue: 1_000, margin: 10 })
    expect(val(r, 'roas')).toBe(5)
    expect(val(r, 'roi')).toBeCloseTo(-50)
    expect(val(r, 'contribution')).toBeCloseTo(-100)
  })
  it('has no break-even ROAS for a zero margin', () => {
    const r = run('online', { margin: 0 })
    expect(r.values.breakEvenRoas).toBeUndefined()
  })
})

describe('tv (percent scale fixture)', () => {
  const r = run('tv', { universe: 1_000_000, reachPct: 50, frequency: 4, spend: 40_000, spots: 20 })
  it.each([
    ['reachPersons', 500_000], ['grp', 200], ['contacts', 2_000_000], ['cpp', 200], ['contactCpm', 20],
    ['avgSpotRating', 10], ['costPerSpot', 2_000],
  ])('%s', (id, expected) => expect(val(r, id)).toBeCloseTo(expected as number, 6))
  it('derives frequency from contacts and unique reach without a universe', () => {
    expect(val(run('tv', { contacts: 2_000_000, reachPersons: 500_000 }), 'frequency')).toBe(4)
  })
  it('rejects reach above 100% derived from GRP and frequency', () => {
    expect(run('tv', { grp: 300, frequency: 2 }).invalid.reachPct).toBeDefined()
  })
})

describe('radio shares the broadcast model', () => {
  it('computes CPP and contact CPM', () => {
    const r = run('radio', { universe: 2_000_000, grp: 150, spend: 15_000 })
    expect(val(r, 'cpp')).toBe(100)
    expect(val(r, 'contacts')).toBe(3_000_000)
    expect(val(r, 'contactCpm')).toBe(5)
  })
})

describe('print', () => {
  const r = run('print', { copies: 100_000, readersPerCopy: 2.5, spend: 5_000, insertions: 2 })
  it.each([['contacts', 250_000], ['circulationCpm', 50], ['contactCpm', 20], ['costPerInsertion', 2_500]])(
    '%s', (id, expected) => expect(val(r, id)).toBeCloseTo(expected as number, 6),
  )
})

describe('ooh', () => {
  const r = run('ooh', { weeklyContacts: 500_000, weeks: 2, spend: 10_000, panels: 50, reachPersons: 250_000 })
  it.each([['contacts', 1_000_000], ['contactCpm', 10], ['panelWeeks', 100], ['costPerPanelWeek', 100], ['frequency', 4]])(
    '%s', (id, expected) => expect(val(r, id)).toBeCloseTo(expected as number, 6),
  )
})

describe('direct mail', () => {
  const r = run('directMail', { piecesSent: 10_000, spend: 8_000, responders: 200, orders: 50, revenue: 10_000 })
  it.each([
    ['responseRate', 2], ['costPerPiece', 0.8], ['costPerResponse', 40], ['orderRate', 25], ['costPerOrder', 160],
    ['revenuePerPiece', 1], ['roas', 1.25],
  ])('%s', (id, expected) => expect(val(r, id)).toBeCloseTo(expected as number, 6))
})

describe.each(categories.map((c) => [c.id, c] as const))('catalog integrity: %s', (_id, c) => {
  const kpis = c.kpiGroups.flatMap((g) => g.kpis)
  const inputs = c.sections.flatMap((s) => [...s.primary, ...s.more])

  it('references only known variables', () => {
    const ids = [...kpis, ...inputs, ...c.relations.flatMap((r) => [r.output, ...r.inputs])]
    for (const id of ids) expect(variables[id], id).toBeDefined()
  })

  it('example derives every KPI without conflicts or invalid values', () => {
    const r = solve(c.example, c.relations, variables)
    expect(r.conflicts).toEqual([])
    expect(r.invalid).toEqual({})
    for (const k of kpis) expect(r.values[k], k).toBeDefined()
  })

  it('example only uses editable inputs', () => {
    for (const id of Object.keys(c.example)) expect(inputs, id).toContain(id)
  })

  it.each(kpis.map((k) => [k]))('every unlock hint for %s really unlocks it', (k) => {
    const hints = c.hints[k]
    expect(hints?.length, `hints for ${k}`).toBeGreaterThan(0)
    const full = solve(c.example, c.relations, variables).values
    for (const set of hints) {
      for (const id of set) expect(inputs, `${k} hint input ${id}`).toContain(id)
      const subset = Object.fromEntries(set.map((id) => [id, full[id].value]))
      expect(solve(subset, c.relations, variables).values[k], `${k} from ${set.join('+')}`).toBeDefined()
    }
  })
})

describe('review regressions', () => {
  it('TV: impossible reach does not leave alternative paths healthy', () => {
    const r = run('tv', { universe: 1_000_000, grp: 300, frequency: 2, spend: 1_000 })
    expect(r.invalid.reachPct).toBeDefined()
    for (const id of ['contacts', 'cpp', 'contactCpm']) expect(r.values[id]?.status, id).toBe('conflict')
  })
  it('formula text shows the percentage-point conversion', () => {
    const online = getCategory('online')
    const formulas = online.relations.map((r) => r.formula)
    expect(formulas).toContain('{contribution} = {revenue} × {margin} ÷ 100 − {spend}')
    expect(formulas).toContain('{breakEvenRoas} = 100 ÷ {margin}')
  })
})
