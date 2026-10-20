import { describe, expect, it } from 'vitest'
import { getCategory } from './catalog'
import { buildView, renderFormula } from './view'
import { toCsv } from './export'

const online = getCategory('online')

describe('buildView', () => {
  it('marks KPIs as locked with the cheapest missing inputs', () => {
    const view = buildView(online, { spend: 1000 })
    const cpc = view.kpis.cpc
    expect(cpc.state).toBe('locked')
    expect(cpc.missing).toEqual(['clicks']) // [spend, clicks] needs 1, [spend, impressions, ctr] needs 2
  })

  it('distinguishes entered, derived and conflicting KPIs', () => {
    const view = buildView(online, { spend: 1000, impressions: 100_000, cpc: 2, clicks: 500 })
    expect(view.kpis.cpm.state).toBe('derived')
    expect(view.kpis.cpc.state).toBe('entered') // 1000 ÷ 500 = 2, consistent
  })

  it('reports an entered KPI as entered', () => {
    const view = buildView(online, { spend: 1000, cpc: 2 })
    expect(view.kpis.cpc.state).toBe('entered')
    expect(view.kpis.cpc.value).toBe(2)
  })

  it('reports conflicts in plain English', () => {
    const view = buildView(online, { spend: 1000, impressions: 100_000, cpm: 20 })
    expect(view.kpis.cpm.state).toBe('conflict')
    expect(view.conflicts[0]).toContain('CPM')
    expect(view.conflicts[0]).toContain('€10.00')
  })

  it('surfaces invalid derived values', () => {
    const view = buildView(getCategory('tv'), { grp: 300, frequency: 2 })
    expect(view.kpis.reachPersons.state).toBe('locked')
    expect(view.invalid.reachPct).toBeDefined()
  })

  it('counts unlocked KPIs', () => {
    const view = buildView(online, online.example)
    expect(view.unlocked).toBe(view.total)
  })
})

describe('renderFormula', () => {
  it('replaces placeholders with category labels', () => {
    expect(renderFormula(online, '{cpm} = {spend} ÷ {impressions} × 1000')).toBe('CPM = Media spend ÷ Impressions × 1000')
    expect(renderFormula(getCategory('directMail'), '{costPerPiece} = {spend} ÷ {piecesSent}')).toBe('Cost per piece = Campaign cost ÷ Pieces sent')
  })
})

describe('toCsv', () => {
  const csv = toCsv(online, { spend: 1000, impressions: 200_000, margin: 0 })
  const lines = csv.replace(/^﻿/, '').trim().split('\r\n')

  it('starts with a BOM for Excel and has a header', () => {
    expect(csv.startsWith('﻿')).toBe(true)
    expect(lines[0]).toBe('Category,Group,Metric,Value,Unit,Status,Formula')
  })
  it('exports raw numbers with unit and status', () => {
    expect(lines).toContain('Online,Inputs,Media spend,1000,EUR,entered,')
    expect(lines).toContain('Online,Cost efficiency,CPM,5,EUR,calculated,CPM = Media spend ÷ Impressions × 1000')
  })
  it('keeps zero distinct from missing', () => {
    expect(lines).toContain('Online,Inputs,Contribution margin,0,%,entered,')
    expect(lines.find((l) => l.includes(',CPC,'))).toBe('Online,Cost efficiency,CPC,,EUR,missing,')
  })
  it('quotes fields with commas and neutralises formula injection', () => {
    expect(toCsv(online, {}).includes('"Cost per 1,000')).toBe(false) // online has no such label
    const tv = toCsv(getCategory('tv'), { spend: 1 })
    expect(tv).toContain('"Cost per 1,000 contacts"')
  })
})

describe('csvField', async () => {
  const { csvField } = await import('./export')
  it.each([
    ['plain', 'plain'],
    ['a,b', '"a,b"'],
    ['say "hi"', '"say ""hi"""'],
    ['=HYPERLINK("x")', `"'=HYPERLINK(""x"")"`],
    ['+1', "'+1"],
    ['@cmd', "'@cmd"],
  ])('%j -> %j', (input, out) => expect(csvField(input)).toBe(out))
  it('does not alter negative numbers', () => expect(csvField(-50)).toBe('-50'))
})

describe('toCsv diagnostics', () => {
  it('exports invalid-value warnings', () => {
    const csv = toCsv(getCategory('tv'), { grp: 300, frequency: 2 })
    expect(csv).toMatch(/Warnings,.*Net reach can't exceed 100%/)
  })
})
