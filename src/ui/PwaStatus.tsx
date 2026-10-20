import { CloudCheck, RefreshCw } from 'lucide-react'

/** "Offline ready" pill. */
export function OfflineBadge({ ready }: { ready: boolean }) {
  if (!ready) return null
  return (
    <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 sm:inline-flex dark:bg-emerald-500/10 dark:text-emerald-200">
      <CloudCheck aria-hidden className="size-3.5" /> Works offline
    </span>
  )
}

/** Updates are applied only on request: reloading clears the unsaved inputs. */
export function UpdateBanner({ onUpdate, onDismiss }: { onUpdate: () => void; onDismiss: () => void }) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3 text-sm print:hidden dark:border-accent-500/30 dark:bg-accent-500/10">
      <RefreshCw aria-hidden className="size-4 text-accent-600" />
      <span className="flex-1">A new version is available. Reloading clears your current inputs.</span>
      <button type="button" onClick={onDismiss} className="min-h-10 rounded-lg px-3 font-medium hover:bg-white/60 dark:hover:bg-slate-800">Later</button>
      <button type="button" onClick={onUpdate} className="min-h-10 rounded-lg bg-accent-600 px-3 font-medium text-white hover:bg-accent-700">Reload and update</button>
    </div>
  )
}

/** Shown in other windows after an update was accepted elsewhere: nothing is reloaded behind the user's back. */
export function UpdatedElsewhereBanner({ onReload, onDismiss }: { onReload: () => void; onDismiss: () => void }) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm print:hidden dark:border-slate-700 dark:bg-slate-900">
      <RefreshCw aria-hidden className="size-4 text-accent-600" />
      <span className="flex-1">A new version was installed from another window. Reload when you're done; reloading clears your inputs.</span>
      <button type="button" onClick={onDismiss} className="min-h-10 rounded-lg px-3 font-medium hover:bg-slate-100 dark:hover:bg-slate-800">Dismiss</button>
      <button type="button" onClick={onReload} className="min-h-10 rounded-lg bg-accent-600 px-3 font-medium text-white hover:bg-accent-700">Reload now</button>
    </div>
  )
}

