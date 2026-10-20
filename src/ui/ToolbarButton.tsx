import type { LucideIcon } from 'lucide-react'

export function ToolbarButton({ icon: Icon, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon }) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium shadow-xs transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
    >
      <Icon aria-hidden className="size-4" />
      {children}
    </button>
  )
}
