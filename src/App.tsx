import { ArrowDown, CircleHelp, RotateCcw, Sparkles } from 'lucide-react'
import logo from './assets/logo.svg'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, getCategory } from './core/catalog'
import { toCsv } from './core/export'
import { buildView } from './core/view'
import { CategoryNav } from './ui/CategoryNav'
import { InputPanel } from './ui/InputPanel'
import { parseInputs, type RawInputs } from './ui/inputs'
import { PrintSummary } from './ui/PrintSummary'
import { QuickStart } from './ui/QuickStart'
import { OfflineBadge, UpdateBanner, UpdatedElsewhereBanner } from './ui/PwaStatus'
import { ResultsPanel } from './ui/ResultsPanel'
import { ToolbarButton } from './ui/ToolbarButton'
import { usePwa } from './ui/usePwa'

/** Category from the URL hash ('' = Online), or undefined for anything else (e.g. in-page anchors). */
const categoryFromHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '')
  if (!id) return 'online'
  return categories.some((c) => c.id === id) ? id : undefined
}

export default function App() {
  const [categoryId, setCategoryId] = useState(() => categoryFromHash() ?? 'online')
  const [lastOffline, setLastOffline] = useState(() => (getCategory(categoryId).group === 'offline' ? categoryId : 'print'))
  // scenarios live in memory only, one per category
  const [rawByCategory, setRawByCategory] = useState<Record<string, RawInputs>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // shown on every start: students who already know the app close it with one click
  const [showGuide, setShowGuide] = useState(true)
  const [today] = useState(() => new Date().toLocaleDateString('de-DE'))
  const panelRef = useRef<HTMLDivElement>(null)
  const pwa = usePwa()

  const category = getCategory(categoryId)
  const raw = useMemo(() => rawByCategory[categoryId] ?? {}, [rawByCategory, categoryId])
  const parsed = useMemo(() => parseInputs(raw), [raw])
  const view = useMemo(() => buildView(category, parsed.values), [category, parsed])

  const show = (id: string) => {
    if (getCategory(id).group === 'offline') setLastOffline(id)
    setCategoryId(id)
  }

  useEffect(() => {
    const onHash = () => {
      const id = categoryFromHash()
      if (id) show(id)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const select = (id: string) => {
    show(id)
    window.location.hash = `/${id}`
  }
  const setRaw = (next: RawInputs) => setRawByCategory((all) => ({ ...all, [categoryId]: next }))
  const sectionKey = (title: string) => `${categoryId}:${title}`
  const loadExample = () => setRaw(Object.fromEntries(Object.entries(category.example).map(([k, v]) => [k, String(v)])))

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
      <a
        href="#category-panel"
        onClick={(e) => {
          // don't touch the hash: it holds the category route
          e.preventDefault()
          panelRef.current?.focus()
        }}
        className="sr-only-focusable fixed top-2 left-2 z-50 rounded-lg bg-accent-600 px-3 py-2 text-white"
      >
        Zum Rechner springen
      </a>
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/85 backdrop-blur-md print:static print:border-0 print:bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <img src={logo} alt="" className="size-8" />
          <div className="flex-1">
            <h1 className="text-base leading-tight font-semibold sm:text-lg">Marketing-KPI-Rechner</h1>
            <p className="hidden text-xs text-slate-600 sm:block print:hidden">Online · TV · Radio · Print · OOH · Mailing</p>
          </div>
          <span className="hidden text-sm text-slate-600 print:inline">{today}</span>
          <span className="print:hidden"><OfflineBadge ready={pwa.offlineReady} /></span>
          {!showGuide && (
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-accent-500 print:hidden"
            >
              <CircleHelp aria-hidden className="size-5" /> So funktioniert’s
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-6 pb-24 sm:px-6 lg:pb-6 print:p-0">
        {pwa.needRefresh && <UpdateBanner onUpdate={pwa.update} onDismiss={pwa.dismiss} />}
        {pwa.updatedElsewhere && <UpdatedElsewhereBanner onReload={pwa.reloadNow} onDismiss={pwa.dismiss} />}
        {showGuide && <QuickStart onExample={loadExample} onClose={() => setShowGuide(false)} />}
        <CategoryNav active={category} lastOffline={lastOffline} onSelect={select} />

        <div
          ref={panelRef}
          id="category-panel"
          role="tabpanel"
          aria-labelledby={`tab-${category.group}`}
          tabIndex={-1}
          className="flex flex-col gap-6 outline-none"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{category.label}</h2>
              <p className="text-slate-600">{category.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <ToolbarButton icon={Sparkles} variant="primary" onClick={loadExample}>
                Beispiel laden
              </ToolbarButton>
              <ToolbarButton icon={RotateCcw} onClick={() => setRaw({})} disabled={Object.keys(raw).length === 0}>
                Zurücksetzen
              </ToolbarButton>
            </div>
          </div>

          <PrintSummary category={category} values={parsed.values} />

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
            <ResultsPanel category={category} view={view} onUnlock={unlock} onExportCsv={exportCsv} />
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-28 text-sm text-slate-600 sm:px-6 lg:pb-10 print:hidden">
        Läuft komplett in deinem Browser und funktioniert offline. Es wird nichts gespeichert oder verschickt – beim Neuladen sind deine Eingaben weg.
        <span className="ml-1 whitespace-nowrap">Version {__APP_VERSION__}</span>
      </footer>

      {/* on small screens results sit below the form: keep them one tap away */}
      <a
        href="#results"
        onClick={(e) => {
          e.preventDefault()
          const results = document.getElementById('results')
          results?.scrollIntoView({ behavior: 'smooth' })
          results?.focus({ preventScroll: true })
        }}
        className="fixed inset-x-4 bottom-4 z-30 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white shadow-lg lg:hidden print:hidden"
      >
        <span>
          {view.unlocked} von {view.total} KPIs verfügbar
          {view.conflicts.length > 0 && <span className="ml-2 text-amber-300">· Konflikt</span>}
        </span>
        <span className="flex items-center gap-1">
          Zu den Ergebnissen <ArrowDown aria-hidden className="size-4" />
        </span>
      </a>
    </div>
  )
}
