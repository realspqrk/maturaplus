import { ChevronDown, CircleHelp, TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { labelFor, variables, type Category, type Section } from '../core/catalog'
import type { Solution } from '../core/solver'
import { formatInput, formatPlain, type RawInputs } from './inputs'

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
    <section aria-labelledby="inputs-title" className="flex flex-col gap-4 print:hidden">
      <div>
        <h2 id="inputs-title" className="text-lg font-semibold">Deine Zahlen</h2>
        <p className="text-sm text-slate-600">
          Trag ein, was du weißt. Alles, was sich daraus berechnen lässt, erscheint automatisch.
        </p>
      </div>
      {category.sections.map((s) => (
        <InputSection
          key={s.title}
          section={s}
          moreLabel={s.more.map((id) => labelFor(category, id)).join(', ')}
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

function InputSection({ section, moreLabel, open, onToggle, render }: {
  section: Section
  moreLabel: string
  open: boolean
  onToggle: () => void
  render: (id: string) => React.ReactNode
}) {
  const panelId = useId()
  const collapsibleOnly = section.primary.length === 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      {collapsibleOnly ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="-m-2 flex w-[calc(100%+1rem)] items-start justify-between gap-2 rounded-xl p-2 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-accent-500"
        >
          <span>
            <span className="block font-semibold">{section.title}</span>
            {section.description && <span className="mt-0.5 block text-sm text-slate-600">{section.description}</span>}
          </span>
          <ChevronDown aria-hidden className={`mt-1 size-5 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <h3 className="mb-3 font-semibold">{section.title}</h3>
      )}
      {section.primary.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{section.primary.map(render)}</div>}
      {section.more.length > 0 && (
        <>
          {!collapsibleOnly && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={onToggle}
              className="mt-3 -mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center justify-between gap-2 rounded-xl px-2 text-left text-sm font-medium text-accent-700 hover:bg-accent-50 focus-visible:outline-2 focus-visible:outline-accent-500"
            >
              <span>
                {open ? 'Weniger Eingaben' : 'Mehr Eingaben'}
                <span className="font-normal text-slate-600">: {moreLabel}</span>
              </span>
              <ChevronDown aria-hidden className={`size-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
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
  const [focused, setFocused] = useState(false)
  const v = variables[id]
  const resolved = solution.values[id]
  const entered = !!raw.trim()
  const derived = !entered && resolved?.source === 'derived' ? resolved : undefined
  const conflict = entered && resolved?.status === 'conflict'
  const inputId = `in-${id}`
  const helpId = `${inputId}-help`
  const noteId = `${inputId}-note`
  const describedBy = [(error || conflict) && noteId, helpOpen && helpId].filter(Boolean).join(' ') || undefined
  const prefix = v.unit === 'currency' ? '€' : undefined
  const suffix = v.unit === 'percent' ? '%' : v.unit === 'ratio' ? '×' : undefined
  const shown = focused || error ? raw : formatInput(raw)

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <button
          type="button"
          aria-label={`Info zu ${label}`}
          aria-expanded={helpOpen}
          aria-controls={helpId}
          onClick={() => setHelpOpen((o) => !o)}
          className="-my-1 grid size-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-accent-500"
        >
          <CircleHelp aria-hidden className="size-4" />
        </button>
      </div>
      <div
        className={`flex items-center rounded-xl border transition focus-within:ring-2 ${
          error
            ? 'border-red-500 bg-white focus-within:ring-red-500/30'
            : conflict
              ? 'border-amber-500 bg-amber-50/60 focus-within:ring-amber-500/30'
              : derived
                ? 'border-accent-100 bg-accent-50/60 focus-within:border-accent-500 focus-within:ring-accent-500/25'
                : 'border-slate-300 bg-white focus-within:border-accent-500 focus-within:ring-accent-500/25'
        }`}
      >
        {prefix && <span aria-hidden className="pl-3 text-slate-500">{prefix}</span>}
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={shown}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={derived ? formatPlain(derived.value, v.unit) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-h-11 w-full min-w-0 rounded-xl bg-transparent px-3 py-2 tabular-nums outline-none placeholder:text-accent-700"
        />
        {derived && (
          <span className="mr-2 shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-accent-700">
            berechnet
          </span>
        )}
        {suffix && <span aria-hidden className="pr-3 text-slate-500">{suffix}</span>}
      </div>
      {error ? (
        <p id={noteId} className="mt-1 text-sm text-red-700">{error}</p>
      ) : conflict ? (
        <p id={noteId} className="mt-1 flex items-center gap-1 text-sm text-amber-800">
          <TriangleAlert aria-hidden className="size-3.5 shrink-0" /> Passt nicht zu deinen anderen Eingaben. Siehe Ergebnisse.
        </p>
      ) : derived && focused ? (
        <p className="mt-1 text-xs text-slate-600">Berechnet. Tipp einen Wert ein, um ihn zu überschreiben.</p>
      ) : null}
      <p id={helpId} hidden={!helpOpen} className="mt-1.5 text-sm text-slate-600">
        {v.help}
      </p>
    </div>
  )
}
