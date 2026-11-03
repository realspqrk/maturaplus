import { GraduationCap, Sparkles, X } from 'lucide-react'
import { ToolbarButton } from './ToolbarButton'

const STEPS = [
  { title: 'Kanal wählen', text: 'Online, TV, Radio oder andere Offline-Medien wie Print, Plakat und Mailing.' },
  { title: 'Bekannte Zahlen eintragen', text: 'Zum Beispiel Mediabudget und Impressions. Du weißt nicht, was du eintragen sollst? Lade ein Beispiel.' },
  { title: 'Ablesen und verstehen', text: 'Die KPIs erscheinen sofort. Öffne bei jeder Karte „So wird gerechnet“, um die Formel mit deinen Zahlen zu sehen.' },
]

/** First thing a student sees: three steps and one obvious action. */
export function QuickStart({ onExample, onClose }: { onExample: () => void; onClose: () => void }) {
  return (
    <section aria-labelledby="quickstart-title" className="relative rounded-2xl border border-accent-100 bg-white p-4 shadow-xs sm:p-5 print:hidden">
      <button
        type="button"
        onClick={onClose}
        aria-label="Anleitung schließen"
        className="absolute top-2 right-2 grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-accent-500"
      >
        <X aria-hidden className="size-5" />
      </button>
      <h2 id="quickstart-title" className="flex items-center gap-2 pr-10 text-lg font-semibold">
        <GraduationCap aria-hidden className="size-5 text-accent-600" /> So funktioniert’s
      </h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-50 text-sm font-semibold text-accent-700">
              {i + 1}
            </span>
            <span>
              <span className="block font-medium">{s.title}</span>
              <span className="block text-sm text-slate-600">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ToolbarButton icon={Sparkles} variant="primary" onClick={onExample}>
          Zeig mir ein Beispiel
        </ToolbarButton>
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-accent-500">
          Verstanden, ausblenden
        </button>
      </div>
    </section>
  )
}
