import { CircleAlert, Lock, Plus, TriangleAlert } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { labelFor, variables, type Category } from '../core/catalog'
import { formatValue } from '../core/format'
import { renderFormula, type CategoryView, type KpiView } from '../core/view'

interface Props {
  category: Category
  view: CategoryView
  onUnlock: (inputId: string) => void
}

export function ResultsPanel({ category, view, onUnlock }: Props) {
  const invalid = Object.entries(view.invalid)
  return (
    <section aria-labelledby="results-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="results-title" className="text-lg font-semibold">Results</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {view.unlocked} of {view.total} KPIs available
          </p>
        </div>
        <Progress value={view.unlocked} max={view.total} />
      </div>
      <LiveStatus view={view} />

      {view.conflicts.length > 0 && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Your numbers don't add up</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {view.conflicts.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <p className="mt-2 text-sm">Fix or clear one of the highlighted inputs. Results based on them are marked as conflicting.</p>
          </div>
        </div>
      )}
      {invalid.length > 0 && (
        <div className="flex gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-950 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <ul className="space-y-0.5 text-sm">
            {invalid.map(([id, msg]) => <li key={id}>{msg} Check the inputs it's calculated from.</li>)}
          </ul>
        </div>
      )}

      {category.kpiGroups.map((g) => (
        <div key={g.title}>
          <h3 className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">{g.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.kpis.map((id) => (
              <KpiCard key={id} category={category} kpi={view.kpis[id]} view={view} onUnlock={onUnlock} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function Progress({ value, max }: { value: number; max: number }) {
  return (
    <div aria-hidden className="h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 print:hidden">
      <div className="h-full rounded-full bg-accent-600 transition-all duration-300 motion-reduce:transition-none" style={{ width: `${(value / max) * 100}%` }} />
    </div>
  )
}

/** Short, debounced announcement instead of re-reading every card on each keystroke. */
function LiveStatus({ view }: { view: CategoryView }) {
  const [msg, setMsg] = useState('')
  const text = `Results updated: ${view.unlocked} KPIs calculated${view.conflicts.length ? `, ${view.conflicts.length} conflict${view.conflicts.length > 1 ? 's' : ''}` : ''}.`
  useEffect(() => {
    const t = setTimeout(() => setMsg(text), 800)
    return () => clearTimeout(t)
  }, [text])
  return <p aria-live="polite" className="sr-only">{msg}</p>
}

const STATE_BADGE = {
  derived: { text: 'Calculated', cls: 'bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-100' },
  entered: { text: 'Entered', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
  conflict: { text: 'Conflict', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100' },
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
      <article aria-labelledby={titleId} className="flex flex-col gap-2 rounded-2xl border border-dashed border-slate-300 p-4 print:hidden dark:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <h4 id={titleId} className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</h4>
          <Lock aria-hidden className="size-4 text-slate-400" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Add{' '}
          {kpi.missing.length === 0 ? 'valid inputs' : kpi.missing.map((id, i) => (
            <span key={id}>
              {i > 0 && (i === kpi.missing.length - 1 ? ' and ' : ', ')}
              <button
                type="button"
                onClick={() => onUnlock(id)}
                className="inline-flex items-center gap-0.5 rounded-md font-medium text-accent-700 underline decoration-accent-500/40 underline-offset-2 hover:decoration-accent-600 focus-visible:outline-2 focus-visible:outline-accent-500 dark:text-accent-100"
              >
                <Plus aria-hidden className="size-3.5" />
                {labelFor(category, id)}
              </button>
            </span>
          ))}{' '}
          to unlock
        </p>
        <Explainer help={v.help} />
      </article>
    )
  }

  const badge = STATE_BADGE[kpi.state]
  const conflict = kpi.state === 'conflict'
  return (
    <article
      aria-labelledby={titleId}
      className={`flex flex-col gap-1 rounded-2xl border bg-white p-4 shadow-xs break-inside-avoid dark:bg-slate-900 ${
        conflict ? 'border-amber-400 dark:border-amber-500/60' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 id={titleId} className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</h4>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>{badge.text}</span>
      </div>
      <p className={`text-2xl font-semibold tracking-tight tabular-nums ${kpi.value !== undefined && kpi.value < 0 ? 'text-red-700 dark:text-red-400' : ''}`}>
        {formatValue(kpi.value!, v.unit)}
      </p>
      {kpi.state === 'derived' && kpi.formula && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          from {kpi.from.map((id) => `${labelFor(category, id)} ${formatValue(view.solution.values[id].value, variables[id].unit)}`).join(', ')}
        </p>
      )}
      <Explainer help={v.help} formula={kpi.formula && renderFormula(category, kpi.formula)} />
    </article>
  )
}

function Explainer({ help, formula }: { help?: string; formula?: string }) {
  return (
    <details className="group mt-1 text-sm print:hidden">
      <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-accent-500 dark:text-slate-400 dark:hover:text-slate-100 [&::-webkit-details-marker]:hidden">
        <span className="transition-transform group-open:rotate-90">›</span> How it's calculated
      </summary>
      <div className="mt-1 space-y-1.5 text-slate-600 dark:text-slate-300">
        {formula && <p className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs dark:bg-slate-800">{formula}</p>}
        <p>{help}</p>
      </div>
    </details>
  )
}
