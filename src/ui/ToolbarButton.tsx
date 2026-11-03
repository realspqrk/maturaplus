import type { LucideIcon } from 'lucide-react'

const VARIANTS = {
  default: 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50',
  primary: 'border-accent-600 bg-accent-600 text-white hover:border-accent-700 hover:bg-accent-700',
}

export function ToolbarButton({ icon: Icon, variant = 'default', children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon
  variant?: keyof typeof VARIANTS
}) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium shadow-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]}`}
    >
      <Icon aria-hidden className="size-4" />
      {children}
    </button>
  )
}
