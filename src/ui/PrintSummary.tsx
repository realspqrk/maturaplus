import { labelFor, variables, type Category } from '../core/catalog'
import { formatValue } from '../core/format'

/** Compact table of entered values, shown only when printing (inputs may sit in collapsed sections). */
export function PrintSummary({ category, values }: { category: Category; values: Record<string, number> }) {
  const ids = category.sections.flatMap((s) => [...s.primary, ...s.more]).filter((id) => id in values)
  return (
    <table aria-label="Your inputs" className="mb-6 hidden w-full max-w-xl border-collapse text-sm print:table">
      <caption className="mb-2 text-left text-lg font-semibold">Your inputs</caption>
      <tbody>
        {ids.map((id) => (
          <tr key={id} className="border-b border-slate-200">
            <th scope="row" className="py-1 pr-4 text-left font-normal">{labelFor(category, id)}</th>
            <td className="py-1 text-right tabular-nums">{formatValue(values[id], variables[id].unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
