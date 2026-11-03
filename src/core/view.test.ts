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

  it('reports conflicts in plain German', () => {
    const view = buildView(online, { spend: 1000, impressions: 100_000, cpm: 20 })
    expect(view.kpis.cpm.state).toBe('conflict')
    expect(view.conflicts[0]).toContain('CPM')
    expect(view.conflicts[0]).toContain('10,00 €')
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
    expect(renderFormula(online, '{cpm} = {spend} ÷ {impressions} × 1000')).toBe('CPM = Mediabudget ÷ Impressions × 1000')
    expect(renderFormula(getCategory('directMail'), '{costPerPiece} = {spend} ÷ {piecesSent}')).toBe('Kosten pro Mailing = Kampagnenkosten ÷ Versendete Mailings')
  })
})

describe('toCsv', () => {
  const csv = toCsv(online, { spend: 1000, impressions: 200_000, margin: 0 })
  const lines = csv.replace(/^﻿/, '').trim().split('\r\n')

  it('starts with a BOM for Excel and has a header', () => {
    expect(csv.startsWith('﻿')).toBe(true)
    expect(lines[0]).toBe('Kategorie;Gruppe;Kennzahl;Wert;Einheit;Status;Formel')
  })
  it('exports raw numbers with unit and status', () => {
    expect(lines).toContain('Online;Eingaben;Mediabudget;1000;EUR;eingegeben;')
    expect(lines).toContain('Online;Kosteneffizienz;CPM;5;EUR;berechnet;CPM = Mediabudget ÷ Impressions × 1000')
  })
  it('writes decimals with a comma and no thousands separator', () => {
    // CTR = 200 clicks ÷ 200,000 impressions × 100 = 0.1 %
    const csv2 = toCsv(online, { spend: 1234.5, impressions: 200_000, clicks: 200 })
    const rows = csv2.replace(/^﻿/, '').trim().split('\r\n')
    expect(rows).toContain('Online;Eingaben;Mediabudget;1234,5;EUR;eingegeben;')
    expect(rows).toContain('Online;Eingaben;Impressions;200000;Anzahl;eingegeben;')
    expect(rows).toContain('Online;Engagement;CTR;0,1;%;berechnet;CTR = Klicks ÷ Impressions × 100')
  })
  it('keeps zero distinct from missing', () => {
    expect(lines).toContain('Online;Eingaben;Deckungsbeitragsquote;0;%;eingegeben;')
    expect(lines.find((l) => l.includes(';CPC;'))).toBe('Online;Kosteneffizienz;CPC;;EUR;fehlt;')
  })
  it('does not quote commas, since the separator is a semicolon', () => {
    const tv = toCsv(getCategory('tv'), { spend: 1 })
    expect(tv).toContain(';TKP (Kosten pro 1.000 Kontakte);')
    const conflict = toCsv(online, { spend: 1000, impressions: 100_000, cpm: 20 })
    expect(conflict).toContain('Online;Konflikte;CPM ist 20,00 €, aber Mediabudget ÷ Impressions × 1000 ergibt 10,00 €.;;;Konflikt;')
  })
  it('separates every row into exactly seven fields', () => {
    for (const l of lines) expect(l.split(';')).toHaveLength(7)
  })
})

describe('csvField', async () => {
  const { csvField } = await import('./export')
  it.each([
    ['plain', 'plain'],
    ['a,b', 'a,b'],
    ['a;b', '"a;b"'],
    ['line\nbreak', '"line\nbreak"'],
    ['cr\rhere', '"cr\rhere"'],
    ['say "hi"', '"say ""hi"""'],
    ['=HYPERLINK("x")', `"'=HYPERLINK(""x"")"`],
    ['+1', "'+1"],
    ['@cmd', "'@cmd"],
  ])('%j -> %j', (input, out) => expect(csvField(input)).toBe(out))
  it('does not alter negative numbers', () => expect(csvField(-50)).toBe('-50'))
  it.each([
    [1234.5, '1234,5'],
    [-0.25, '-0,25'],
    [2_000_000, '2000000'],
    [0, '0'],
  ])('writes number %d as %j', (n, out) => expect(csvField(n)).toBe(out))
  it('leaves undefined empty', () => expect(csvField(undefined)).toBe(''))
})

describe('toCsv diagnostics', () => {
  it('exports invalid-value warnings', () => {
    const csv = toCsv(getCategory('tv'), { grp: 300, frequency: 2 })
    expect(csv).toMatch(/;Warnungen;Netto-Reichweite darf nicht größer als 100 % sein\.;;;ungültig;/)
  })
})

describe('conflict wording', () => {
  it('describes the direction of the formula that was actually evaluated', () => {
    const view = buildView(online, { spend: 100, impressions: 0, cpm: 5 })
    expect(view.conflicts[0]).toBe('Mediabudget ist 100,00 €, aber CPM × Impressions ÷ 1000 ergibt 0,00 €.')
  })
})
