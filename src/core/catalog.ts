import { product, ratio, relation, type Relation, type Variable } from './model'

const v = (id: string, label: string, unit: Variable['unit'], help: string, bounds: Partial<Variable> = { min: 0 }): Variable => ({
  id, label, unit, help, ...bounds,
})

const list: Variable[] = [
  // business outcome
  v('spend', 'Media spend', 'currency', 'What you paid for the media in this campaign (net, excluding VAT). Use the same cost basis for every KPI.'),
  v('revenue', 'Attributed revenue', 'currency', 'Revenue attributed to this campaign for the same period and attribution model.'),
  v('margin', 'Contribution margin', 'percent', 'Share of revenue left after the cost of goods and other variable costs, before marketing. Needed for profit and ROI.', { min: 0, max: 100 }),
  v('contribution', 'Contribution after media', 'currency', 'Revenue × margin − media spend. What the campaign contributed after paying for the media. Can be negative.', {}),
  v('roas', 'ROAS', 'ratio', 'Return on ad spend = revenue ÷ media spend. A ROAS of 4× means €4 of revenue for every €1 spent. It ignores margin, so compare it with the break-even ROAS.'),
  v('roi', 'Marketing ROI', 'percent', 'Contribution after media ÷ media spend. 0% means break-even. Negative means the campaign lost money after margin.', {}),
  v('breakEvenRoas', 'Break-even ROAS', 'ratio', '100 ÷ margin %. The ROAS you need for the campaign to pay for itself at your margin.'),

  // online
  v('impressions', 'Impressions', 'count', 'Number of times the ad was served (gross, not unique people).'),
  v('clicks', 'Clicks', 'count', 'Clicks on the ad.'),
  v('conversions', 'Conversions', 'count', 'Completed target actions (e.g. purchases, sign-ups). Count them consistently for the same period and attribution model as the spend.'),
  v('leads', 'Leads', 'count', 'Qualified leads generated (e.g. contact forms).'),
  v('views', 'Video views', 'count', 'Qualified video views as defined by the platform (e.g. ≥ 30 s or complete view).'),
  v('cpm', 'CPM', 'currency', 'Cost per mille = media spend ÷ impressions × 1,000. The price of 1,000 impressions.'),
  v('cpc', 'CPC', 'currency', 'Cost per click = media spend ÷ clicks.'),
  v('ctr', 'CTR', 'percent', 'Click-through rate = clicks ÷ impressions × 100.', { min: 0, max: 100 }),
  v('cvr', 'Conversion rate', 'percent', 'Click-based conversion rate = conversions ÷ clicks × 100. Can exceed 100% if one click leads to several conversions.'),
  v('cpa', 'CPA', 'currency', 'Cost per action = media spend ÷ conversions.'),
  v('cpl', 'CPL', 'currency', 'Cost per lead = media spend ÷ leads.'),
  v('cpv', 'CPV', 'currency', 'Cost per view = media spend ÷ qualified video views.'),
  v('viewRate', 'View rate', 'percent', 'Qualified views ÷ video impressions × 100.', { min: 0, max: 100 }),
  v('revenuePerConversion', 'Revenue per conversion', 'currency', 'Attributed revenue ÷ conversions. Equals average order value only if every conversion is an order.'),

  // audience (broadcast, OOH, online reach)
  v('universe', 'Audience universe', 'count', 'Size of the audience the ratings are measured against, in persons. Use the total TV/radio population to get GRPs, or your target group to get TRPs.'),
  v('reachPct', 'Net reach', 'percent', 'Share of the universe reached at least once.', { min: 0, max: 100 }),
  v('reachPersons', 'Unique reach', 'count', 'Number of different people reached at least once (de-duplicated).'),
  v('frequency', 'Average frequency', 'number', 'Average number of contacts per person reached. Always ≥ 1.', { min: 1 }),
  v('grp', 'Rating points (GRP/TRP)', 'points', 'Gross rating points = net reach % × average frequency, or the sum of all spot ratings. Measured against the universe you entered: TRPs if that is a target group.'),
  v('contacts', 'Gross contacts', 'count', 'Total contacts (impacts), counting repeat exposures. Rating points ÷ 100 × universe.'),
  v('cpp', 'Cost per point (CPP)', 'currency', 'Media spend ÷ rating points. The cost of reaching 1% of the universe once.'),
  v('contactCpm', 'Cost per 1,000 contacts', 'currency', 'Media spend ÷ gross contacts × 1,000. Comparable with online CPM.'),
  v('spots', 'Spots', 'count', 'Number of spots (airings) in the schedule.'),
  v('costPerSpot', 'Cost per spot', 'currency', 'Media spend ÷ number of spots.'),
  v('avgSpotRating', 'Average spot rating', 'points', 'Rating points ÷ spots. The average share of the universe one spot reaches.'),

  // print
  v('copies', 'Distributed copies', 'count', 'Total copies distributed across all insertions (circulation × insertions).'),
  v('readersPerCopy', 'Readers per copy', 'number', 'Average readers per copy, from readership research.'),
  v('insertions', 'Insertions', 'count', 'Number of ad placements.'),
  v('circulationCpm', 'Cost per 1,000 copies', 'currency', 'Media spend ÷ distributed copies × 1,000.'),
  v('costPerInsertion', 'Cost per insertion', 'currency', 'Media spend ÷ insertions.'),

  // ooh
  v('panels', 'Panels / sites', 'count', 'Number of billboard faces or screens booked.'),
  v('weeks', 'Weeks', 'number', 'Campaign duration in weeks.'),
  v('weeklyContacts', 'Weekly contacts', 'count', 'Gross contacts per week for the whole booked inventory (e.g. from audience measurement).'),
  v('panelWeeks', 'Panel weeks', 'number', 'Panels × weeks.'),
  v('costPerPanelWeek', 'Cost per panel per week', 'currency', 'Media spend ÷ (panels × weeks).'),

  // direct mail
  v('piecesSent', 'Pieces sent', 'count', 'Number of mail pieces sent.'),
  v('responders', 'Responders', 'count', 'Unique recipients who responded (call, visit, coupon, web).'),
  v('orders', 'Orders', 'count', 'Orders placed by responders.'),
  v('responseRate', 'Response rate', 'percent', 'Responders ÷ pieces sent × 100.', { min: 0, max: 100 }),
  v('costPerPiece', 'Cost per piece', 'currency', 'Campaign cost ÷ pieces sent.'),
  v('costPerResponse', 'Cost per response', 'currency', 'Campaign cost ÷ responders.'),
  v('orderRate', 'Responder-to-order rate', 'percent', 'Orders ÷ responders × 100.'),
  v('costPerOrder', 'Cost per order', 'currency', 'Campaign cost ÷ orders.'),
  v('revenuePerPiece', 'Revenue per piece', 'currency', 'Attributed revenue ÷ pieces sent.'),
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
  title: 'Budget & results', primary: [spendLabel, 'revenue', 'margin'], more: [],
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
  title: 'Known rates',
  description: 'Already know a rate from your media plan? Enter it and the missing volumes are filled in.',
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
    { title: 'Audience & schedule', primary: ['universe', 'reachPct', 'frequency'], more: ['grp', 'spots', 'contacts', 'reachPersons'] },
    ratesSection(['cpp', 'contactCpm']),
  ],
  kpiGroups: [
    { title: 'Reach & weight', kpis: ['grp', 'reachPersons', 'contacts', 'avgSpotRating'] },
    { title: 'Cost efficiency', kpis: ['cpp', 'contactCpm', 'costPerSpot'] },
    { title: 'Business outcome', kpis: businessKpis },
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
    tagline: 'Display, social, search and video campaigns',
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
      { title: 'Delivery', primary: ['impressions', 'clicks', 'conversions'], more: ['leads', 'views', 'reachPersons'] },
      ratesSection(['cpm', 'cpc', 'ctr', 'cvr', 'cpa']),
    ],
    kpiGroups: [
      { title: 'Cost efficiency', kpis: ['cpm', 'cpc', 'cpa', 'cpl', 'cpv'] },
      { title: 'Engagement', kpis: ['ctr', 'cvr', 'viewRate', 'frequency'] },
      { title: 'Business outcome', kpis: [...businessKpis, 'revenuePerConversion'] },
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
    labels: { reachPersons: 'Unique users reached' },
    example: {
      spend: 10_000, revenue: 40_000, margin: 30, impressions: 2_000_000, clicks: 20_000, conversions: 400,
      leads: 500, views: 300_000, reachPersons: 400_000,
    },
  },
  broadcast('tv', 'TV', 'Linear TV schedules measured in rating points', {
    spend: 120_000, revenue: 360_000, margin: 40, universe: 5_000_000, reachPct: 45, frequency: 3.2, spots: 40,
  }),
  broadcast('radio', 'Radio', 'Radio schedules measured in rating points', {
    spend: 30_000, revenue: 60_000, margin: 40, universe: 5_000_000, reachPct: 35, frequency: 6, spots: 120,
  }),
  {
    id: 'print', label: 'Print', group: 'offline',
    tagline: 'Newspapers and magazines',
    relations: [
      ...product('contacts', 'copies', 'readersPerCopy'),
      ...ratio('circulationCpm', 'spend', 'copies', 1000),
      ...ratio('contactCpm', 'spend', 'contacts', 1000),
      ...ratio('costPerInsertion', 'spend', 'insertions'),
      ...business,
    ],
    sections: [
      budgetSection(),
      { title: 'Circulation', primary: ['copies', 'readersPerCopy', 'insertions'], more: ['contacts'] },
      ratesSection(['circulationCpm', 'contactCpm']),
    ],
    kpiGroups: [
      { title: 'Reach & weight', kpis: ['contacts'] },
      { title: 'Cost efficiency', kpis: ['circulationCpm', 'contactCpm', 'costPerInsertion'] },
      { title: 'Business outcome', kpis: businessKpis },
    ],
    hints: {
      contacts: [['copies', 'readersPerCopy']],
      circulationCpm: [['spend', 'copies']],
      contactCpm: [['spend', 'contacts'], ['spend', 'copies', 'readersPerCopy']],
      costPerInsertion: [['spend', 'insertions']],
      ...businessHints,
    },
    labels: { contacts: 'Reader contacts', contactCpm: 'Cost per 1,000 reader contacts' },
    example: { spend: 18_000, revenue: 45_000, margin: 35, copies: 240_000, readersPerCopy: 2.4, insertions: 2 },
  },
  {
    id: 'ooh', label: 'Out-of-home', group: 'offline',
    tagline: 'Billboards, posters and digital screens',
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
      { title: 'Inventory & audience', primary: ['panels', 'weeks', 'weeklyContacts'], more: ['contacts', 'reachPersons'] },
      ratesSection(['contactCpm', 'costPerPanelWeek']),
    ],
    kpiGroups: [
      { title: 'Reach & weight', kpis: ['contacts', 'frequency'] },
      { title: 'Cost efficiency', kpis: ['contactCpm', 'costPerPanelWeek'] },
      { title: 'Business outcome', kpis: businessKpis },
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
    id: 'directMail', label: 'Direct mail', group: 'offline',
    tagline: 'Addressed mailings and inserts',
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
      { title: 'Mailing', primary: ['piecesSent', 'responders', 'orders'], more: [] },
      ratesSection(['responseRate', 'costPerPiece', 'orderRate']),
    ],
    kpiGroups: [
      { title: 'Response', kpis: ['responseRate', 'orderRate'] },
      { title: 'Cost efficiency', kpis: ['costPerPiece', 'costPerResponse', 'costPerOrder'] },
      { title: 'Business outcome', kpis: [...businessKpis, 'revenuePerPiece'] },
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
    labels: { spend: 'Campaign cost' },
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
