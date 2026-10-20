import { Download, Moon, Printer, RotateCcw, Sparkles, Sun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { categories, getCategory } from './core/catalog'
import { toCsv } from './core/export'
import { buildView } from './core/view'
import { CategoryNav } from './ui/CategoryNav'
import { InputPanel } from './ui/InputPanel'
import { parseInputs, type RawInputs } from './ui/inputs'
import { OfflineBadge, UpdateBanner } from './ui/PwaStatus'
import { usePwa } from './ui/usePwa'
import { ResultsPanel } from './ui/ResultsPanel'

const categoryFromHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '')
  return categories.some((c) => c.id === id) ? id : 'online'
}

export default function App() {
  const [categoryId, setCategoryId] = useState(categoryFromHash)
  const [lastOffline, setLastOffline] = useState('print')
  // scenarios live in memory only, one per category
  const [rawByCategory, setRawByCategory] = useState<Record<string, RawInputs>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const pwa = usePwa()
  const [today] = useState(() => new Date().toLocaleDateString('en-IE'))

  const category = getCategory(categoryId)
  const raw = useMemo(() => rawByCategory[categoryId] ?? {}, [rawByCategory, categoryId])
  const parsed = useMemo(() => parseInputs(raw), [raw])
  const view = useMemo(() => buildView(category, parsed.values), [category, parsed])

  useEffect(() => {
    const onHash = () => setCategoryId(categoryFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const select = (id: string) => {
    if (getCategory(id).group === 'offline') setLastOffline(id)
    setCategoryId(id)
    window.location.hash = `/${id}`
  }
  const setRaw = (next: RawInputs) => setRawByCategory((all) => ({ ...all, [categoryId]: next }))
  const sectionKey = (title: string) => `${categoryId}:${title}`

  const unlock = (inputId: string) => {
    const section = category.sections.find((s) => s.more.includes(inputId))
    if (section) setExpanded((e) => ({ ...e, [sectionKey(section.title)]: true }))
    requestAnimationFrame(() => document.getElementById(`in-${inputId}`)?.focus())
  }

  const exportCsv = () => {
    const blob = new Blob([toCsv(category, parsed.values)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kpi-${category.id}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const expandedForCategory = Object.fromEntries(
    category.sections.map((s) => [s.title, !!expanded[sectionKey(s.title)]]),
  )

  return (
    <div className="min-h-dvh">
      <a href="#category-panel" className="sr-only-focusable fixed top-2 left-2 z-50 rounded-lg bg-accent-600 px-3 py-2 text-white">
        Skip to calculator
      </a>
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/85 backdrop-blur-md print:static print:border-0 print:bg-white dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <img src="/favicon.svg" alt="" className="size-8" />
          <div className="flex-1">
            <h1 className="text-base leading-tight font-semibold sm:text-lg">Marketing KPI Calculator</h1>
            <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">Online · TV · Radio · Print · OOH · Direct mail</p>
          </div>
          <OfflineBadge ready={pwa.offlineReady} />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        {pwa.needRefresh && <UpdateBanner onUpdate={pwa.update} onDismiss={pwa.dismiss} />}
        <CategoryNav active={category} lastOffline={lastOffline} onSelect={select} />

        <div id="category-panel" role="tabpanel" aria-labelledby={`tab-${category.group}`} tabIndex={-1} className="flex flex-col gap-6 outline-none">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="hidden text-sm text-slate-500 print:block">Marketing KPI report · {today}</p>
              <h2 className="text-2xl font-semibold tracking-tight">{category.label}</h2>
              <p className="text-slate-600 dark:text-slate-400">{category.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <ToolbarButton icon={Sparkles} onClick={() => setRaw(Object.fromEntries(Object.entries(category.example).map(([k, v]) => [k, String(v)])))}>
                Try an example
              </ToolbarButton>
              <ToolbarButton icon={RotateCcw} onClick={() => setRaw({})} disabled={Object.keys(raw).length === 0}>
                Reset
              </ToolbarButton>
              <ToolbarButton icon={Download} onClick={exportCsv}>Export CSV</ToolbarButton>
              <ToolbarButton icon={Printer} onClick={() => window.print()}>Print / Save as PDF</ToolbarButton>
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] print:block">
            <InputPanel
              category={category}
              raw={raw}
              errors={parsed.errors}
              solution={view.solution}
              expanded={expandedForCategory}
              onToggle={(t) => setExpanded((e) => ({ ...e, [sectionKey(t)]: !e[sectionKey(t)] }))}
              onChange={(id, text) => {
                const next = { ...raw, [id]: text }
                if (!text) delete next[id]
                setRaw(next)
              }}
            />
            <div className="print:mt-6">
              <ResultsPanel category={category} view={view} onUnlock={unlock} />
            </div>
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pt-2 pb-10 text-sm text-slate-500 sm:px-6 dark:text-slate-400">
        Runs entirely in your browser and works offline. Nothing is stored or sent anywhere, so your inputs are cleared when you reload.
      </footer>
    </div>
  )
}

function ToolbarButton({ icon: Icon, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: typeof Download }) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium shadow-xs transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
    >
      <Icon aria-hidden className="size-4" />
      {children}
    </button>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // storage unavailable (private mode): theme just won't be remembered
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-200/70 focus-visible:outline-2 focus-visible:outline-accent-500 print:hidden dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {dark ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
    </button>
  )
}
