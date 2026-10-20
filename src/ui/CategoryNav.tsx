import { Mail, MonitorSmartphone, Newspaper, Presentation, Radio, Tv, type LucideIcon } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import { categories, type Category } from '../core/catalog'

const TABS: { group: Category['group']; label: string; icon: LucideIcon; hint: string }[] = [
  { group: 'online', label: 'Online', icon: MonitorSmartphone, hint: 'Digital' },
  { group: 'tv', label: 'TV', icon: Tv, hint: 'Broadcast' },
  { group: 'radio', label: 'Radio', icon: Radio, hint: 'Broadcast' },
  { group: 'offline', label: 'Other offline', icon: Newspaper, hint: 'Print · OOH · Mail' },
]

const SUB_ICONS: Record<string, LucideIcon> = { print: Newspaper, ooh: Presentation, directMail: Mail }

interface Props {
  active: Category
  lastOffline: string
  onSelect: (categoryId: string) => void
}

export function CategoryNav({ active, lastOffline, onSelect }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = TABS.findIndex((t) => t.group === active.group)
  const select = (i: number) => {
    const t = TABS[i]
    onSelect(t.group === 'offline' ? lastOffline : t.group)
    refs.current[i]?.focus()
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: (activeIndex + 1) % TABS.length,
      ArrowLeft: (activeIndex - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    }
    if (e.key in keys) {
      e.preventDefault()
      select(keys[e.key])
    }
  }
  const offline = categories.filter((c) => c.group === 'offline')

  return (
    <nav aria-label="Channel categories" className="print:hidden">
      <div
        role="tablist"
        aria-label="Channel"
        onKeyDown={onKeyDown}
        className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-200/70 p-1.5 sm:grid-cols-4 dark:bg-slate-800/70"
      >
        {TABS.map((t, i) => {
          const selected = i === activeIndex
          const Icon = t.icon
          return (
            <button
              key={t.group}
              ref={(el) => {
                refs.current[i] = el
              }}
              role="tab"
              id={`tab-${t.group}`}
              aria-selected={selected}
              aria-controls="category-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              className={`flex min-h-12 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
                selected
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white dark:ring-1 dark:ring-accent-500/60'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/50 dark:hover:text-white'
              }`}
            >
              <Icon aria-hidden className={`size-5 shrink-0 ${selected ? 'text-accent-600 dark:text-accent-100' : ''}`} />
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">{t.label}</span>
                <span className="text-xs text-slate-600 dark:text-slate-400">{t.hint}</span>
              </span>
            </button>
          )
        })}
      </div>

      {active.group === 'offline' && (
        <fieldset className="mt-3">
          <legend className="sr-only">Offline channel</legend>
          <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {offline.map((c) => {
              const Icon = SUB_ICONS[c.id]
              const checked = c.id === active.id
              return (
                <label
                  key={c.id}
                  className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium transition has-focus-visible:outline-2 has-focus-visible:outline-accent-500 ${
                    checked
                      ? 'bg-accent-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="offline-channel"
                    value={c.id}
                    checked={checked}
                    onChange={() => onSelect(c.id)}
                    className="sr-only"
                  />
                  <Icon aria-hidden className="size-4" />
                  {c.label}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
    </nav>
  )
}
