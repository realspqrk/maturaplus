import { ChevronDown, CircleHelp } from 'lucide-react'
import { useId, useState } from 'react'
import { labelFor, variables, type Category, type Section } from '../core/catalog'
import type { Solution } from '../core/solver'
import { formatPlain, type RawInputs } from './inputs'

interface Props {
  category: Category
  raw: RawInputs
  errors: Record<string, string>
  solution: Solution
  expanded: Record<string, boolean>
  onToggle: (sectionTitle: string) => void
  onChange: (id: string, text: string) => void
}

export function InputPanel({ category, raw, errors, solution, expanded, onToggle, onChange }: Props) {
  return (
    <section aria-labelledby="inputs-title" className="flex flex-col gap-4">
      <div>
        <h2 id="inputs-title" className="text-lg font-semibold">Your numbers</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enter what you know. Everything else that can be worked out appears automatically.
        </p>
      </div>
      {category.sections.map((s) => (
        <InputSection
          key={s.title}
          section={s}
          open={!!expanded[s.title]}
          onToggle={() => onToggle(s.title)}
          render={(id) => (
            <Field
              key={id}
              id={id}
              label={labelFor(category, id)}
              raw={raw[id] ?? ''}
              error={errors[id]}
              solution={solution}
              onChange={(t) => onChange(id, t)}
            />
          )}
        />
      ))}
    </section>
  )
}

function InputSection({ section, open, onToggle, render }: {
  section: Section
  open: boolean
  onToggle: () => void
  render: (id: string) => React.ReactNode
}) {
  const panelId = useId()
  const collapsibleOnly = section.primary.length === 0
  const toggle = (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onToggle}
      className={
        collapsibleOnly
          ? 'flex w-full items-center justify-between gap-2 rounded-lg text-left font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500'
          : 'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 -mx-2 text-sm font-medium text-accent-700 hover:bg-accent-50 focus-visible:outline-2 focus-visible:outline-accent-500 dark:text-accent-100 dark:hover:bg-slate-800'
      }
    >
      <span>{collapsibleOnly ? section.title : `${open ? 'Fewer' : 'More'} inputs (${section.more.length})`}</span>
      <ChevronDown aria-hidden className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      {collapsibleOnly ? toggle : <h3 className="mb-3 font-semibold">{section.title}</h3>}
      {section.description && (open || !collapsibleOnly) && (
        <p className="mt-1 mb-3 text-sm text-slate-600 dark:text-slate-400">{section.description}</p>
      )}
      {section.primary.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{section.primary.map(render)}</div>}
      {section.more.length > 0 && (
        <>
          {!collapsibleOnly && <div className="mt-3 print:hidden">{toggle}</div>}
          <div id={panelId} hidden={!open} className="mt-3">
            <div className="grid gap-3 sm:grid-cols-2">{section.more.map(render)}</div>
          </div>
        </>
      )}
    </div>
  )
}

function Field({ id, label, raw, error, solution, onChange }: {
  id: string
  label: string
  raw: string
  error?: string
  solution: Solution
  onChange: (text: string) => void
}) {
  const [helpOpen, setHelpOpen] = useState(false)
  const v = variables[id]
  const resolved = solution.values[id]
  const derived = !raw.trim() && resolved?.source === 'derived' ? resolved : undefined
  const conflict = resolved?.status === 'conflict' && !!raw.trim()
  const inputId = `in-${id}`
  const helpId = `${inputId}-help`
  const errorId = `${inputId}-error`
  const describedBy = [error && errorId, helpOpen && helpId].filter(Boolean).join(' ') || undefined
  const prefix = v.unit === 'currency' ? '€' : undefined
  const suffix = v.unit === 'percent' ? '%' : v.unit === 'ratio' ? '×' : undefined

  return (
    <div className={raw.trim() || derived ? '' : 'print:hidden'}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
        <span className="flex items-center gap-1">
          {derived && (
            <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-medium text-accent-700 dark:bg-accent-500/15 dark:text-accent-100">
              calculated
            </span>
          )}
          <button
            type="button"
            aria-label={`About ${label}`}
            aria-expanded={helpOpen}
            aria-controls={helpId}
            onClick={() => setHelpOpen((o) => !o)}
            className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-accent-500 print:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <CircleHelp aria-hidden className="size-4" />
          </button>
        </span>
      </div>
      <div
        className={`flex items-center rounded-xl border bg-white transition focus-within:ring-2 dark:bg-slate-950 ${
          error
            ? 'border-red-500 focus-within:ring-red-500/30'
            : conflict
              ? 'border-amber-500 focus-within:ring-amber-500/30'
              : 'border-slate-300 focus-within:border-accent-500 focus-within:ring-accent-500/25 dark:border-slate-700'
        }`}
      >
        {prefix && <span aria-hidden className="pl-3 text-slate-500 dark:text-slate-400">{prefix}</span>}
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          placeholder={derived ? `${formatPlain(derived.value, v.unit)} · calculated` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-h-11 w-full min-w-0 rounded-xl bg-transparent px-3 py-2 tabular-nums outline-none placeholder:text-accent-700/80 placeholder:italic dark:placeholder:text-accent-100/70"
        />
        {suffix && <span aria-hidden className="pr-3 text-slate-500 dark:text-slate-400">{suffix}</span>}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <p id={helpId} hidden={!helpOpen} className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
        {v.help}
      </p>
    </div>
  )
}
