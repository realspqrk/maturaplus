import { product, ratio, relation, type Relation, type Variable } from './model'

const v = (id: string, label: string, unit: Variable['unit'], help: string, bounds: Partial<Variable> = { min: 0 }): Variable => ({
  id, label, unit, help, ...bounds,
})

const list: Variable[] = [
  // Geschäftsergebnis
  v('spend', 'Mediabudget', 'currency', 'Was du für die Medien in dieser Kampagne bezahlt hast (netto, ohne USt.). Verwende für alle KPIs dieselbe Kostenbasis.'),
  v('revenue', 'Zugeordneter Umsatz', 'currency', 'Umsatz, der dieser Kampagne zugerechnet wird – für denselben Zeitraum und dasselbe Attributionsmodell.'),
  v('margin', 'Deckungsbeitragsquote', 'percent', 'Anteil des Umsatzes, der nach Warenkosten und anderen variablen Kosten übrig bleibt – vor den Marketingkosten. Wird für Deckungsbeitrag und ROI benötigt.', { min: 0, max: 100 }),
  v('contribution', 'Deckungsbeitrag nach Media', 'currency', 'Umsatz × Deckungsbeitragsquote − Mediabudget. Was die Kampagne nach Abzug der Mediakosten beigetragen hat. Kann negativ sein.', {}),
  v('roas', 'ROAS', 'ratio', 'Return on Ad Spend = Umsatz ÷ Mediabudget. Ein ROAS von 4× bedeutet 4 € Umsatz pro ausgegebenem Euro. Die Marge bleibt dabei unberücksichtigt – vergleiche ihn daher mit dem Break-even-ROAS.'),
  v('roi', 'Marketing-ROI', 'percent', 'Deckungsbeitrag nach Media ÷ Mediabudget. 0 % bedeutet Break-even. Negativ heißt: Die Kampagne hat nach Abzug der Kosten Geld verloren.', {}),
  v('breakEvenRoas', 'Break-even-ROAS', 'ratio', '100 ÷ Deckungsbeitragsquote in %. Der ROAS, den die Kampagne bei deiner Marge mindestens braucht, um sich selbst zu bezahlen.'),

  // online
  v('impressions', 'Impressions', 'count', 'Wie oft die Anzeige ausgeliefert wurde (brutto, nicht einzelne Personen).'),
  v('clicks', 'Klicks', 'count', 'Klicks auf die Anzeige.'),
  v('conversions', 'Conversions', 'count', 'Abgeschlossene Zielaktionen (z. B. Käufe, Anmeldungen). Zähle sie für denselben Zeitraum und dasselbe Attributionsmodell wie das Budget.'),
  v('leads', 'Leads', 'count', 'Gewonnene qualifizierte Leads (z. B. ausgefüllte Kontaktformulare).'),
  v('views', 'Video-Views', 'count', 'Qualifizierte Videoaufrufe laut Definition der Plattform (z. B. ≥ 30 s oder vollständig angesehen).'),
  v('cpm', 'CPM', 'currency', 'Cost per Mille (auf Deutsch TKP, Tausend-Kontakt-Preis) = Mediabudget ÷ Impressions × 1.000. Der Preis für 1.000 Impressions.'),
  v('cpc', 'CPC', 'currency', 'Cost per Click = Mediabudget ÷ Klicks.'),
  v('ctr', 'CTR', 'percent', 'Click-Through-Rate = Klicks ÷ Impressions × 100.', { min: 0, max: 100 }),
  v('cvr', 'Conversion-Rate', 'percent', 'Klickbasierte Conversion-Rate = Conversions ÷ Klicks × 100. Kann über 100 % liegen, wenn ein Klick zu mehreren Conversions führt.'),
  v('cpa', 'CPA', 'currency', 'Cost per Action = Mediabudget ÷ Conversions.'),
  v('cpl', 'CPL', 'currency', 'Cost per Lead = Mediabudget ÷ Leads.'),
  v('cpv', 'CPV', 'currency', 'Cost per View = Mediabudget ÷ qualifizierte Video-Views.'),
  v('viewRate', 'View-Rate', 'percent', 'Qualifizierte Views ÷ Video-Impressions × 100.', { min: 0, max: 100 }),
  v('revenuePerConversion', 'Umsatz pro Conversion', 'currency', 'Zugeordneter Umsatz ÷ Conversions. Entspricht nur dann dem durchschnittlichen Bestellwert, wenn jede Conversion eine Bestellung ist.'),

  // audience (broadcast, OOH, online reach)
  v('universe', 'Grundgesamtheit', 'count', 'Größe des Publikums, auf das sich die Ratings beziehen, in Personen. Die gesamte TV-/Radiobevölkerung ergibt GRP, deine Zielgruppe ergibt TRP.'),
  v('reachPct', 'Netto-Reichweite', 'percent', 'Anteil der Grundgesamtheit, der mindestens einmal erreicht wurde.', { min: 0, max: 100 }),
  v('reachPersons', 'Erreichte Personen', 'count', 'Anzahl verschiedener Personen, die mindestens einmal erreicht wurden (ohne Doppelzählung).'),
  v('frequency', 'Ø Kontaktfrequenz', 'number', 'Durchschnittliche Anzahl an Kontakten pro erreichter Person. Immer mindestens 1.', { min: 1 }),
  v('grp', 'Rating Points (GRP/TRP)', 'points', 'Gross Rating Points = Netto-Reichweite in % × Ø Kontaktfrequenz oder die Summe aller Spot-Ratings. Bezogen auf die eingegebene Grundgesamtheit: TRP, wenn das eine Zielgruppe ist.'),
  v('contacts', 'Bruttokontakte', 'count', 'Alle Kontakte inklusive Mehrfachkontakten. Rating Points ÷ 100 × Grundgesamtheit.'),
  v('cpp', 'Cost per Point (CPP)', 'currency', 'Mediabudget ÷ Rating Points. Die Kosten, um 1 % der Grundgesamtheit einmal zu erreichen.'),
  v('contactCpm', 'TKP (Kosten pro 1.000 Kontakte)', 'currency', 'Tausend-Kontakt-Preis = Mediabudget ÷ Bruttokontakte × 1.000. Vergleichbar mit dem Online-CPM.'),
  v('spots', 'Spots', 'count', 'Anzahl der Spots (Ausstrahlungen) im Schaltplan.'),
  v('costPerSpot', 'Kosten pro Spot', 'currency', 'Mediabudget ÷ Anzahl der Spots.'),
  v('avgSpotRating', 'Ø Spot-Rating', 'points', 'Rating Points ÷ Spots. Der durchschnittliche Anteil der Grundgesamtheit, den ein Spot erreicht.'),

  // print
  v('copies', 'Verbreitete Auflage', 'count', 'Insgesamt verbreitete Exemplare über alle Schaltungen (Auflage × Schaltungen).'),
  v('readersPerCopy', 'Leser pro Exemplar', 'number', 'Durchschnittliche Anzahl Leser pro Exemplar laut Leserschaftsforschung (z. B. Media-Analyse).'),
  v('insertions', 'Schaltungen', 'count', 'Anzahl der geschalteten Anzeigen.'),
  v('circulationCpm', 'Kosten pro 1.000 Exemplare', 'currency', 'Mediabudget ÷ verbreitete Auflage × 1.000.'),
  v('costPerInsertion', 'Kosten pro Schaltung', 'currency', 'Mediabudget ÷ Schaltungen.'),

  // ooh
  v('panels', 'Werbeflächen', 'count', 'Anzahl der gebuchten Plakatflächen oder Screens.'),
  v('weeks', 'Wochen', 'number', 'Kampagnendauer in Wochen.'),
  v('weeklyContacts', 'Kontakte pro Woche', 'count', 'Bruttokontakte pro Woche für alle gebuchten Flächen zusammen (z. B. aus der Reichweitenmessung).'),
  v('panelWeeks', 'Flächenwochen', 'number', 'Werbeflächen × Wochen.'),
  v('costPerPanelWeek', 'Kosten pro Fläche und Woche', 'currency', 'Mediabudget ÷ (Werbeflächen × Wochen).'),

  // direct mail
  v('piecesSent', 'Versendete Mailings', 'count', 'Anzahl der verschickten Aussendungen.'),
  v('responders', 'Responder', 'count', 'Empfänger, die reagiert haben (Anruf, Besuch, Gutschein, Website), jeweils nur einmal gezählt.'),
  v('orders', 'Bestellungen', 'count', 'Bestellungen der Responder.'),
  v('responseRate', 'Responsequote', 'percent', 'Responder ÷ versendete Mailings × 100.', { min: 0, max: 100 }),
  v('costPerPiece', 'Kosten pro Mailing', 'currency', 'Kampagnenkosten ÷ versendete Mailings.'),
  v('costPerResponse', 'Kosten pro Response', 'currency', 'Kampagnenkosten ÷ Responder.'),
  v('orderRate', 'Bestellquote', 'percent', 'Bestellungen ÷ Responder × 100.'),
  v('costPerOrder', 'Kosten pro Bestellung', 'currency', 'Kampagnenkosten ÷ Bestellungen.'),
  v('revenuePerPiece', 'Umsatz pro Mailing', 'currency', 'Zugeordneter Umsatz ÷ versendete Mailings.'),
]

export const variables: Record<string, Variable> = Object.fromEntries(list.map((x) => [x.id, x]))

const business: Relation[] = [
  ...ratio('roas', 'revenue', 'spend'),
  relation('contribution', ['revenue', 'margin', 'spend'], (r, m, s) => (r * m) / 100 - s,
    '{contribution} = {revenue} × {margin} ÷ 100 − {spend}'),
  ...ratio('roi', 'contribution', 'spend', 100),
  relation('breakEvenRoas', ['margin'], (m) => (m > 0 ? 100 / m : undefined), '{breakEvenRoas} = 100 ÷ {margin}'),
]

const businessKpis = ['roas', 'roi', 'contribution', 'breakEvenRoas']
const businessHints: Record<string, string[][]> = {
  roas: [['revenue', 'spend']],
  roi: [['revenue', 'margin', 'spend']],
  contribution: [['revenue', 'margin', 'spend']],
  breakEvenRoas: [['margin']],
}
const budgetSection = (spendLabel = 'spend'): Section => ({
  title: 'Budget & Ergebnis', primary: [spendLabel, 'revenue', 'margin'], more: [],
})

export interface Section {
  title: string
  description?: string
  primary: string[]
  more: string[]
}

export interface Category {
  id: string
  label: string
  /** top-level navigation group */
  group: 'online' | 'tv' | 'radio' | 'offline'
  tagline: string
  relations: Relation[]
  sections: Section[]
  kpiGroups: { title: string; kpis: string[] }[]
  /** alternative sets of inputs that unlock each KPI */
  hints: Record<string, string[][]>
  /** per-category label overrides */
  labels?: Record<string, string>
  example: Record<string, number>
}

const ratesSection = (ids: string[]): Section => ({
  title: 'Bekannte Kennzahlen',
  description: 'Du kennst eine Kennzahl schon aus dem Mediaplan? Trag sie ein, dann werden die fehlenden Mengen ergänzt.',
  primary: [],
  more: ids,
})

const broadcast = (id: 'tv' | 'radio', label: string, tagline: string, example: Record<string, number>): Category => ({
  id, label, group: id, tagline,
  relations: [
    ...product('grp', 'reachPct', 'frequency'),
    ...product('reachPersons', 'reachPct', 'universe', 100),
    ...product('contacts', 'grp', 'universe', 100),
    ...ratio('frequency', 'contacts', 'reachPersons'),
    ...ratio('cpp', 'spend', 'grp'),
    ...ratio('contactCpm', 'spend', 'contacts', 1000),
    ...ratio('avgSpotRating', 'grp', 'spots'),
    ...ratio('costPerSpot', 'spend', 'spots'),
    ...business,
  ],
  sections: [
    budgetSection(),
    { title: 'Publikum & Schaltplan', primary: ['universe', 'reachPct', 'frequency'], more: ['grp', 'spots', 'contacts', 'reachPersons'] },
    ratesSection(['cpp', 'contactCpm']),
  ],
  kpiGroups: [
    { title: 'Reichweite & Kontakte', kpis: ['grp', 'reachPersons', 'contacts', 'avgSpotRating'] },
    { title: 'Kosteneffizienz', kpis: ['cpp', 'contactCpm', 'costPerSpot'] },
    { title: 'Geschäftsergebnis', kpis: businessKpis },
  ],
  hints: {
    grp: [['reachPct', 'frequency'], ['contacts', 'universe']],
    reachPersons: [['reachPct', 'universe']],
    contacts: [['grp', 'universe'], ['reachPct', 'frequency', 'universe']],
    avgSpotRating: [['grp', 'spots'], ['reachPct', 'frequency', 'spots']],
    cpp: [['spend', 'grp'], ['spend', 'reachPct', 'frequency']],
    contactCpm: [['spend', 'contacts'], ['spend', 'grp', 'universe']],
    costPerSpot: [['spend', 'spots']],
    ...businessHints,
  },
  example,
})

export const categories: Category[] = [
  {
    id: 'online', label: 'Online', group: 'online',
    tagline: 'Display-, Social-, Search- und Video-Kampagnen',
    relations: [
      ...ratio('cpm', 'spend', 'impressions', 1000),
      ...ratio('cpc', 'spend', 'clicks'),
      ...ratio('ctr', 'clicks', 'impressions', 100),
      ...ratio('cvr', 'conversions', 'clicks', 100),
      ...ratio('cpa', 'spend', 'conversions'),
      ...ratio('cpl', 'spend', 'leads'),
      ...ratio('cpv', 'spend', 'views'),
      ...ratio('viewRate', 'views', 'impressions', 100),
      ...ratio('frequency', 'impressions', 'reachPersons'),
      ...ratio('revenuePerConversion', 'revenue', 'conversions'),
      ...business,
    ],
    sections: [
      budgetSection(),
      { title: 'Auslieferung', primary: ['impressions', 'clicks', 'conversions'], more: ['leads', 'views', 'reachPersons'] },
      ratesSection(['cpm', 'cpc', 'ctr', 'cvr', 'cpa']),
    ],
    kpiGroups: [
      { title: 'Kosteneffizienz', kpis: ['cpm', 'cpc', 'cpa', 'cpl', 'cpv'] },
      { title: 'Engagement', kpis: ['ctr', 'cvr', 'viewRate', 'frequency'] },
      { title: 'Geschäftsergebnis', kpis: [...businessKpis, 'revenuePerConversion'] },
    ],
    hints: {
      cpm: [['spend', 'impressions']],
      cpc: [['spend', 'clicks'], ['spend', 'impressions', 'ctr']],
      cpa: [['spend', 'conversions'], ['spend', 'clicks', 'cvr']],
      cpl: [['spend', 'leads']],
      cpv: [['spend', 'views']],
      ctr: [['clicks', 'impressions']],
      cvr: [['conversions', 'clicks']],
      viewRate: [['views', 'impressions']],
      frequency: [['impressions', 'reachPersons']],
      revenuePerConversion: [['revenue', 'conversions']],
      ...businessHints,
    },
    labels: { reachPersons: 'Unique User' },
    example: {
      spend: 10_000, revenue: 40_000, margin: 30, impressions: 2_000_000, clicks: 20_000, conversions: 400,
      leads: 500, views: 300_000, reachPersons: 400_000,
    },
  },
  broadcast('tv', 'TV', 'Lineare TV-Schaltpläne, gemessen in Rating Points', {
    spend: 120_000, revenue: 360_000, margin: 40, universe: 5_000_000, reachPct: 45, frequency: 3.2, spots: 40,
  }),
  broadcast('radio', 'Radio', 'Radio-Schaltpläne, gemessen in Rating Points', {
    spend: 30_000, revenue: 60_000, margin: 40, universe: 5_000_000, reachPct: 35, frequency: 6, spots: 120,
  }),
  {
    id: 'print', label: 'Print', group: 'offline',
    tagline: 'Zeitungen und Zeitschriften',
    relations: [
      ...product('contacts', 'copies', 'readersPerCopy'),
      ...ratio('circulationCpm', 'spend', 'copies', 1000),
      ...ratio('contactCpm', 'spend', 'contacts', 1000),
      ...ratio('costPerInsertion', 'spend', 'insertions'),
      ...business,
    ],
    sections: [
      budgetSection(),
      { title: 'Auflage', primary: ['copies', 'readersPerCopy', 'insertions'], more: ['contacts'] },
      ratesSection(['circulationCpm', 'contactCpm']),
    ],
    kpiGroups: [
      { title: 'Reichweite & Kontakte', kpis: ['contacts'] },
      { title: 'Kosteneffizienz', kpis: ['circulationCpm', 'contactCpm', 'costPerInsertion'] },
      { title: 'Geschäftsergebnis', kpis: businessKpis },
    ],
    hints: {
      contacts: [['copies', 'readersPerCopy']],
      circulationCpm: [['spend', 'copies']],
      contactCpm: [['spend', 'contacts'], ['spend', 'copies', 'readersPerCopy']],
      costPerInsertion: [['spend', 'insertions']],
      ...businessHints,
    },
    labels: { contacts: 'Leserkontakte', contactCpm: 'TKP (Kosten pro 1.000 Leserkontakte)' },
    example: { spend: 18_000, revenue: 45_000, margin: 35, copies: 240_000, readersPerCopy: 2.4, insertions: 2 },
  },
  {
    id: 'ooh', label: 'Out-of-Home', group: 'offline',
    tagline: 'Plakate, Billboards und digitale Screens',
    relations: [
      ...product('contacts', 'weeklyContacts', 'weeks'),
      ...product('panelWeeks', 'panels', 'weeks'),
      ...ratio('costPerPanelWeek', 'spend', 'panelWeeks'),
      ...ratio('contactCpm', 'spend', 'contacts', 1000),
      ...ratio('frequency', 'contacts', 'reachPersons'),
      ...business,
    ],
    sections: [
      budgetSection(),
      { title: 'Flächen & Publikum', primary: ['panels', 'weeks', 'weeklyContacts'], more: ['contacts', 'reachPersons'] },
      ratesSection(['contactCpm', 'costPerPanelWeek']),
    ],
    kpiGroups: [
      { title: 'Reichweite & Kontakte', kpis: ['contacts', 'frequency'] },
      { title: 'Kosteneffizienz', kpis: ['contactCpm', 'costPerPanelWeek'] },
      { title: 'Geschäftsergebnis', kpis: businessKpis },
    ],
    hints: {
      contacts: [['weeklyContacts', 'weeks']],
      frequency: [['contacts', 'reachPersons'], ['weeklyContacts', 'weeks', 'reachPersons']],
      contactCpm: [['spend', 'contacts'], ['spend', 'weeklyContacts', 'weeks']],
      costPerPanelWeek: [['spend', 'panels', 'weeks']],
      ...businessHints,
    },
    example: { spend: 24_000, revenue: 50_000, margin: 35, panels: 80, weeks: 2, weeklyContacts: 1_500_000, reachPersons: 900_000 },
  },
  {
    id: 'directMail', label: 'Mailing', group: 'offline',
    tagline: 'Adressierte Mailings und Beilagen',
    relations: [
      ...ratio('responseRate', 'responders', 'piecesSent', 100),
      ...ratio('costPerPiece', 'spend', 'piecesSent'),
      ...ratio('costPerResponse', 'spend', 'responders'),
      ...ratio('orderRate', 'orders', 'responders', 100),
      ...ratio('costPerOrder', 'spend', 'orders'),
      ...ratio('revenuePerPiece', 'revenue', 'piecesSent'),
      ...business,
    ],
    sections: [
      budgetSection(),
      { title: 'Aussendung', primary: ['piecesSent', 'responders', 'orders'], more: [] },
      ratesSection(['responseRate', 'costPerPiece', 'orderRate']),
    ],
    kpiGroups: [
      { title: 'Response', kpis: ['responseRate', 'orderRate'] },
      { title: 'Kosteneffizienz', kpis: ['costPerPiece', 'costPerResponse', 'costPerOrder'] },
      { title: 'Geschäftsergebnis', kpis: [...businessKpis, 'revenuePerPiece'] },
    ],
    hints: {
      responseRate: [['responders', 'piecesSent']],
      orderRate: [['orders', 'responders']],
      costPerPiece: [['spend', 'piecesSent']],
      costPerResponse: [['spend', 'responders'], ['spend', 'piecesSent', 'responseRate']],
      costPerOrder: [['spend', 'orders']],
      revenuePerPiece: [['revenue', 'piecesSent']],
      ...businessHints,
    },
    labels: { spend: 'Kampagnenkosten' },
    example: { spend: 16_000, revenue: 24_000, margin: 45, piecesSent: 20_000, responders: 500, orders: 120 },
  },
]

export function getCategory(id: string): Category {
  const c = categories.find((x) => x.id === id)
  if (!c) throw new Error(`Unknown category ${id}`)
  return c
}

export function labelFor(category: Category, id: string): string {
  return category.labels?.[id] ?? variables[id]?.label ?? id
}
