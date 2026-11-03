import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const pwa = vi.hoisted(() => ({
  needRefresh: false,
  update: (() => {}) as (reload?: boolean) => void,
  options: {} as { onNeedReload?: () => void },
  reload: (() => {}) as () => void,
}))
vi.mock('virtual:pwa-register/react', async () => {
  const { useState } = await import('react')
  return {
    useRegisterSW: (options: typeof pwa.options) => {
      pwa.options = options
      const refresh = useState(pwa.needRefresh)
      return { offlineReady: [false, () => {}], needRefresh: refresh, updateServiceWorker: pwa.update }
    },
  }
})
vi.mock('./ui/reload', () => ({ reloadPage: () => pwa.reload() }))

const setup = () => {
  const user = userEvent.setup()
  render(<App />)
  return user
}
const card = (name: string) => screen.getByRole('article', { name })
const field = (name: string) => screen.getByRole('textbox', { name })

beforeEach(() => {
  window.location.hash = ''
  pwa.needRefresh = false
})

describe('App', () => {
  it('starts on the Online category with all KPIs locked', () => {
    setup()
    expect(screen.getByRole('tab', { name: /online/i })).toHaveAttribute('aria-selected', 'true')
    expect(within(card('CPM')).getByText(/ergänze/i)).toBeInTheDocument()
  })

  it('calculates CPM live from spend and impressions', async () => {
    const user = setup()
    await user.type(field('Mediabudget'), '5000')
    await user.type(field('Impressions'), '1.000.000')
    expect(within(card('CPM')).getByText('5,00 €')).toBeInTheDocument()
    expect(within(card('CPM')).getByText('Berechnet')).toBeInTheDocument()
  })

  it('shows calculated values as placeholders in empty input fields', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /bekannte kennzahlen/i }))
    await user.type(field('Mediabudget'), '1000')
    await user.type(field('CPM'), '5')
    expect(field('Impressions')).toHaveAttribute('placeholder', expect.stringContaining('200.000'))
  })

  it('unlock hint focuses the missing input, expanding a collapsed section', async () => {
    const user = setup()
    await user.type(field('Mediabudget'), '1000')
    await user.click(within(card('CPL')).getByRole('button', { name: /leads/i }))
    const leads = field('Leads')
    expect(leads).toBeVisible()
    await act(() => new Promise((r) => requestAnimationFrame(r)))
    expect(leads).toHaveFocus()
  })

  it('shows a conflict alert for contradictory inputs', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /bekannte kennzahlen/i }))
    await user.type(field('Mediabudget'), '1000')
    await user.type(field('Impressions'), '100000')
    await user.type(field('CPM'), '20')
    expect(screen.getByRole('alert')).toHaveTextContent(/CPM ist 20,00\s€/)
  })

  it('marks invalid input with an accessible error', async () => {
    const user = setup()
    await user.type(field('Deckungsbeitragsquote'), '120')
    const margin = field('Deckungsbeitragsquote')
    expect(margin).toHaveAttribute('aria-invalid', 'true')
    expect(margin).toHaveAccessibleDescription(/darf nicht größer als 100\s% sein/)
    await user.clear(margin)
    await user.type(margin, '1,2,3')
    expect(margin).toHaveAccessibleDescription('Gib eine Zahl ein, z. B. 1.234,56')
  })

  it('keeps scenarios isolated per category', async () => {
    const user = setup()
    await user.type(field('Mediabudget'), '1000')
    await user.click(screen.getByRole('tab', { name: /^tv/i }))
    expect(field('Mediabudget')).toHaveValue('')
    await user.click(screen.getByRole('tab', { name: /online/i }))
    expect(field('Mediabudget')).toHaveValue('1.000')
  })

  it('offers print, out-of-home and direct mail under Other offline', async () => {
    const user = setup()
    await user.click(screen.getByRole('tab', { name: /weitere offline-kanäle/i }))
    await user.click(screen.getByRole('radio', { name: /mailing/i }))
    expect(field('Kampagnenkosten')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/directMail')
  })

  it('fills an example and resets it', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Beispiel laden' }))
    expect(field('Mediabudget')).toHaveValue('10.000')
    expect(within(screen.getByRole('region', { name: 'Ergebnisse' })).getByText(/14 von 14 KPIs/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Zurücksetzen' }))
    expect(field('Mediabudget')).toHaveValue('')
  })

  it('shows the quick-start guide at start; its example button fills the current category', async () => {
    const user = setup()
    const guide = screen.getByRole('region', { name: 'So funktioniert’s' })
    expect(screen.queryByRole('button', { name: 'So funktioniert’s' })).not.toBeInTheDocument()
    await user.click(within(guide).getByRole('button', { name: 'Zeig mir ein Beispiel' }))
    expect(field('Mediabudget')).toHaveValue('10.000')
  })

  it('hides the guide on request and reopens it from the header', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Verstanden, ausblenden' }))
    expect(screen.queryByRole('region', { name: 'So funktioniert’s' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'So funktioniert’s' }))
    expect(screen.getByRole('region', { name: 'So funktioniert’s' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anleitung schließen' }))
    expect(screen.queryByRole('region', { name: 'So funktioniert’s' })).not.toBeInTheDocument()
  })

  it('exports the current category as CSV', async () => {
    const user = setup()
    const create = vi.fn<(b: Blob) => string>(() => 'blob:x')
    URL.createObjectURL = create as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await user.type(field('Mediabudget'), '1000')
    await user.click(screen.getByRole('button', { name: /csv exportieren/i }))
    expect(click).toHaveBeenCalled()
    const text = await create.mock.calls[0][0].text()
    expect(text).toContain('Mediabudget;1000;EUR;eingegeben')
  })

  it('opens print dialog for PDF', async () => {
    const user = setup()
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    await user.click(screen.getByRole('button', { name: /drucken \/ als pdf speichern/i }))
    expect(print).toHaveBeenCalled()
  })

  it('formats entered numbers with separators when not editing', async () => {
    const user = setup()
    await user.type(field('Impressions'), '2000000')
    expect(field('Impressions')).toHaveValue('2000000')
    await user.tab()
    expect(field('Impressions')).toHaveValue('2.000.000')
    await user.click(field('Impressions'))
    expect(field('Impressions')).toHaveValue('2000000')
  })

  it('explains conflicts next to the affected input', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /bekannte kennzahlen/i }))
    await user.type(field('Mediabudget'), '1000')
    await user.type(field('Impressions'), '100000')
    await user.type(field('CPM'), '20')
    expect(field('CPM')).toHaveAccessibleDescription(/passt nicht zu deinen anderen eingaben/i)
  })

  it('says whether ROAS beats break-even', async () => {
    const user = setup()
    await user.type(field('Mediabudget'), '1000')
    await user.type(field('Zugeordneter Umsatz'), '1500')
    await user.type(field('Deckungsbeitragsquote'), '30')
    expect(screen.getByText(/unter dem break-even/i)).toBeInTheDocument()
    await user.clear(field('Zugeordneter Umsatz'))
    await user.type(field('Zugeordneter Umsatz'), '5000')
    expect(screen.getByText(/über dem break-even/i)).toBeInTheDocument()
  })

  it('lists entered inputs (including collapsed ones) in the print summary', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /mehr eingaben/i }))
    await user.type(field('Unique User'), '400000')
    await user.click(screen.getByRole('button', { name: /weniger eingaben/i }))
    const table = screen.getByRole('table', { name: /deine eingaben/i })
    expect(within(table).getByText('Unique User')).toBeInTheDocument()
    expect(within(table).getByText('400.000')).toBeInTheDocument()
  })

  it('skip link focuses the calculator without changing the category', async () => {
    window.location.hash = '#/tv'
    const user = setup()
    await user.click(screen.getByRole('link', { name: /zum rechner springen/i }))
    expect(screen.getByRole('tab', { name: /^tv/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it('remembers a deep-linked offline sub-category', async () => {
    window.location.hash = '#/ooh'
    const user = setup()
    await user.click(screen.getByRole('tab', { name: /online/i }))
    await user.click(screen.getByRole('tab', { name: /weitere offline-kanäle/i }))
    expect(screen.getByRole('radio', { name: /out-of-home/i })).toBeChecked()
  })

  it('applies an app update only when asked', async () => {
    pwa.needRefresh = true
    const update = vi.fn()
    pwa.update = update
    const user = setup()
    expect(screen.getByText(/neue version ist verfügbar/i)).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Später' }))
    expect(screen.queryByText(/neue version ist verfügbar/i)).not.toBeInTheDocument()
    cleanupAndRender()
    await userEvent.click(screen.getByRole('button', { name: /neu laden und aktualisieren/i }))
    expect(update).toHaveBeenCalledWith(true)
  })

  it('returns to Online when history goes back to the bare URL', async () => {
    const user = setup()
    await user.click(screen.getByRole('tab', { name: /^tv/i }))
    act(() => {
      window.location.hash = ''
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('tab', { name: /online/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('mobile "View results" moves focus to the results', async () => {
    const user = setup()
    Element.prototype.scrollIntoView = vi.fn()
    await user.click(screen.getByRole('link', { name: /zu den ergebnissen/i }))
    expect(screen.getByRole('region', { name: 'Ergebnisse' })).toHaveFocus()
  })

  it('labels an exact break-even as such', async () => {
    const user = setup()
    await user.type(field('Mediabudget'), '100')
    await user.type(field('Zugeordneter Umsatz'), '200')
    await user.type(field('Deckungsbeitragsquote'), '50')
    expect(screen.getByText(/^genau am break-even/i)).toBeInTheDocument()
  })

  it('only the window that accepted the update reloads; other windows keep their inputs', async () => {
    pwa.needRefresh = true
    const reload = vi.fn()
    pwa.reload = reload
    pwa.update = () => {}
    const user = setup()
    await user.type(field('Mediabudget'), '1000')
    // another window accepted the update and the new version took control of this one
    act(() => pwa.options.onNeedReload?.())
    expect(reload).not.toHaveBeenCalled()
    expect(field('Mediabudget')).toHaveValue('1000') // still focused: raw text
    expect(screen.getByText(/in einem anderen fenster wurde eine neue version installiert/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /jetzt neu laden/i }))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloads after the update was accepted in this window', async () => {
    pwa.needRefresh = true
    const reload = vi.fn()
    pwa.reload = reload
    pwa.update = () => pwa.options.onNeedReload?.()
    const user = setup()
    await user.click(screen.getByRole('button', { name: /neu laden und aktualisieren/i }))
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

function cleanupAndRender() {
  document.body.innerHTML = ''
  render(<App />)
}
