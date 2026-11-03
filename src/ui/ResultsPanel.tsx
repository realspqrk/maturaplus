import { ChevronRight, CircleAlert, Equal, Download, Lock, Plus, Printer, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { labelFor, variables, type Category } from '../core/catalog'
import { formatValue } from '../core/format'
import { approxEqual } from '../core/solver'
import { renderFormula, type CategoryView, type KpiView } from '../core/view'
import { ToolbarButton } from './ToolbarButton'

interface Props {
  category: Category
  view: CategoryView
  onUnlock: (inputId: string) => void
  onExportCsv: () => void
}

export function ResultsPanel({ category, view, onUnlock, onExportCsv }: Props) {
  const invalid = Object.entries(view.invalid)
  return (
    <section id="results" tabIndex={-1} aria-labelledby="results-title" className="flex scroll-mt-24 flex-col gap-5 outline-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="results-title" className="text-lg font-semibold">Ergebnisse</h2>
          <div className="mt-1 flex items-center gap-3">
            <Progress value={view.unlocked} max={view.total} />
            <p className="text-sm text-slate-600">
              {view.unlocked} von {view.total} KPIs verfügbar
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <ToolbarButton icon={Download} onClick={onExportCsv}>CSV exportieren</ToolbarButton>
          <ToolbarButton icon={Printer} onClick={() => window.print()}>Drucken / Als PDF speichern</ToolbarButton>
        </div>
      </div>
      <LiveStatus view={view} />

      {view.conflicts.length > 0 && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Deine Zahlen passen nicht zusammen</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {view.conflicts.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <p className="mt-2 text-sm">Korrigiere oder leere eines der markierten Felder. Ergebnisse, die darauf beruhen, sind als Konflikt markiert.</p>
          </div>
        </div>
      )}
      {invalid.length > 0 && (
        <div className="flex gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-950">
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <ul className="space-y-0.5 text-sm">
            {invalid.map(([id, msg]) => <li key={id}>{msg} Prüfe die Eingaben, aus denen der Wert berechnet wird.</li>)}
          </ul>
        </div>
      )}

      <Verdict view={view} />

      {category.kpiGroups.map((g) => (
        <div key={g.title} className="break-inside-avoid-page">
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-slate-600 uppercase break-after-avoid">{g.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
            {g.kpis.map((id) => (
              <KpiCard key={id} category={category} kpi={view.kpis[id]} view={view} onUnlock={onUnlock} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

/** Puts ROAS in context: a ROAS only means profit when it beats 1 ÷ margin. */
function Verdict({ view }: { view: CategoryView }) {
  const roas = view.kpis.roas
  const be = view.kpis.breakEvenRoas
  if (roas?.value === undefined || be?.value === undefined || roas.state === 'conflict' || be.state === 'conflict') return null
  const at = approxEqual(roas.value, be.value, 'ratio')
  const above = !at && roas.value > be.value
  const Icon = at ? Equal : above ? TrendingUp : TrendingDown
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${
        at
          ? 'border-slate-200 bg-slate-100 text-slate-900'
          : above
          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
          : 'border-red-200 bg-red-50 text-red-950'
      }`}
    >
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <p className="text-sm">
        <strong className="font-semibold">{at ? 'Genau am Break-even' : above ? 'Über dem Break-even' : 'Unter dem Break-even'}:</strong>{' '}
        ROAS {formatValue(roas.value, 'ratio')} gegenüber Break-even {formatValue(be.value, 'ratio')}.{' '}
        {at
          ? 'Der Deckungsbeitrag deckt die Mediakosten genau.'
          : above
          ? 'Bei deiner Marge macht sich die Kampagne bezahlt.'
          : 'Bei deiner Marge deckt der Umsatz die Mediakosten nicht.'}
      </p>
    </div>
  )
}

function Progress({ value, max }: { value: number; max: number }) {
  return (
    <div aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 print:hidden">
      <div className="h-full rounded-full bg-accent-600 transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${(value / max) * 100}%` }} />
    </div>
  )
}

/** Short, debounced announcement instead of re-reading every card on each keystroke. */
function LiveStatus({ view }: { view: CategoryView }) {
  const [msg, setMsg] = useState('')
  const n = view.conflicts.length
  const text = `Ergebnisse aktualisiert: ${view.unlocked} KPIs berechnet${n ? `, ${n} ${n > 1 ? 'Konflikte' : 'Konflikt'}` : ''}.`
  useEffect(() => {
    // an identical summary after a value change must still mutate the region to be announced
    const t = setTimeout(() => setMsg((m) => (m === text ? `${text} ` : text)), 800)
    return () => clearTimeout(t)
  }, [view, text])
  return <p aria-live="polite" className="sr-only">{msg}</p>
}

const STATE_BADGE = {
  derived: { text: 'Berechnet', cls: 'bg-accent-50 text-accent-700' },
  entered: { text: 'Eingegeben', cls: 'bg-slate-100 text-slate-700' },
  conflict: { text: 'Konflikt', cls: 'bg-amber-100 text-amber-900' },
}

function KpiCard({ category, kpi, view, onUnlock }: {
  category: Category
  kpi: KpiView
  view: CategoryView
  onUnlock: (id: string) => void
}) {
  const titleId = useId()
  const v = variables[kpi.id]
  const label = labelFor(category, kpi.id)

  if (kpi.state === 'locked') {
    return (
      <article aria-labelledby={titleId} className="flex flex-col gap-1 rounded-2xl border border-dashed border-slate-300 px-4 py-3 print:hidden">
        <div className="flex items-center justify-between gap-2">
          <h4 id={titleId} className="text-sm font-medium text-slate-700">{label}</h4>
          <Lock aria-hidden className="size-3.5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-600">
          Ergänze{' '}
          {kpi.missing.length === 0 ? 'gültige Eingaben' : kpi.missing.map((id, i) => (
            <span key={id}>
              {i > 0 && (i === kpi.missing.length - 1 ? ' und ' : ', ')}
              <button
                type="button"
                onClick={() => onUnlock(id)}
                className="inline-flex items-center gap-0.5 rounded-md font-medium text-accent-700 underline decoration-accent-500/40 underline-offset-2 hover:decoration-accent-600 focus-visible:outline-2 focus-visible:outline-accent-500"
              >
                <Plus aria-hidden className="size-3.5" />
                {labelFor(category, id)}
              </button>
            </span>
          ))}
        </p>
        <Explainer summary="Über diese KPI" help={v.help} />
      </article>
    )
  }

  const badge = STATE_BADGE[kpi.state]
  const conflict = kpi.state === 'conflict'
  const negative = kpi.value !== undefined && kpi.value < 0
  return (
    <article
      aria-labelledby={titleId}
      className={`flex flex-col gap-1 rounded-2xl border bg-white px-4 py-3.5 shadow-xs break-inside-avoid ${
        conflict ? 'border-amber-400' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 id={titleId} className="text-sm font-medium text-slate-600">{label}</h4>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>{badge.text}</span>
      </div>
      <p className={`text-2xl font-semibold tracking-tight tabular-nums ${negative ? 'text-red-700' : ''}`}>
        {formatValue(kpi.value!, v.unit)}
        {negative && <span className="ml-2 align-middle text-xs font-medium">Verlust</span>}
      </p>
      <Explainer
        summary={kpi.formula ? 'So wird gerechnet' : 'Über diese KPI'}
        help={v.help}
        formula={kpi.formula && renderFormula(category, kpi.formula)}
        from={kpi.state !== 'entered' ? kpi.from.map((id) => `${labelFor(category, id)}: ${formatValue(view.solution.values[id].value, variables[id].unit)}`) : []}
      />
    </article>
  )
}

function Explainer({ summary, help, formula, from = [] }: { summary: string; help?: string; formula?: string; from?: string[] }) {
  return (
    <details className="group text-sm print:hidden">
      <summary className="-mx-1 flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-md px-1 text-xs font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-accent-500 sm:min-h-8 [&::-webkit-details-marker]:hidden">
        <ChevronRight aria-hidden className="size-3.5 transition-transform group-open:rotate-90" /> {summary}
      </summary>
      <div className="mt-1 space-y-1.5 text-slate-600">
        {formula && <p className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs">{formula}</p>}
        {from.length > 0 && <p className="text-xs">Mit {from.join(' · ')}</p>}
        <p>{help}</p>
      </div>
    </details>
  )
}
