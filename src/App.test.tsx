import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const pwa = vi.hoisted(() => ({ needRefresh: false, update: (() => {}) as (reload?: boolean) => void }))
vi.mock('virtual:pwa-register/react', async () => {
  const { useState } = await import('react')
  return {
    useRegisterSW: () => {
      const refresh = useState(pwa.needRefresh)
      return { offlineReady: [false, () => {}], needRefresh: refresh, updateServiceWorker: pwa.update }
    },
  }
})

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
    expect(within(card('CPM')).getByText(/add/i)).toBeInTheDocument()
  })

  it('calculates CPM live from spend and impressions', async () => {
    const user = setup()
    await user.type(field('Media spend'), '5000')
    await user.type(field('Impressions'), '1,000,000')
    expect(within(card('CPM')).getByText('€5.00')).toBeInTheDocument()
    expect(within(card('CPM')).getByText('Calculated')).toBeInTheDocument()
  })

  it('shows calculated values as placeholders in empty input fields', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /known rates/i }))
    await user.type(field('Media spend'), '1000')
    await user.type(field('CPM'), '5')
    expect(field('Impressions')).toHaveAttribute('placeholder', expect.stringContaining('200,000'))
  })

  it('unlock hint focuses the missing input, expanding a collapsed section', async () => {
    const user = setup()
    await user.type(field('Media spend'), '1000')
    await user.click(within(card('CPL')).getByRole('button', { name: /leads/i }))
    const leads = field('Leads')
    expect(leads).toBeVisible()
    await act(() => new Promise((r) => requestAnimationFrame(r)))
    expect(leads).toHaveFocus()
  })

  it('shows a conflict alert for contradictory inputs', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /known rates/i }))
    await user.type(field('Media spend'), '1000')
    await user.type(field('Impressions'), '100000')
    await user.type(field('CPM'), '20')
    expect(screen.getByRole('alert')).toHaveTextContent(/CPM is €20.00/)
  })

  it('marks invalid input with an accessible error', async () => {
    const user = setup()
    await user.type(field('Contribution margin'), '120')
    const margin = field('Contribution margin')
    expect(margin).toHaveAttribute('aria-invalid', 'true')
    expect(margin).toHaveAccessibleDescription(/can't exceed 100%/)
    await user.clear(margin)
    await user.type(margin, '1.2.3')
    expect(margin).toHaveAccessibleDescription(/number/i)
  })

  it('keeps scenarios isolated per category', async () => {
    const user = setup()
    await user.type(field('Media spend'), '1000')
    await user.click(screen.getByRole('tab', { name: /^tv/i }))
    expect(field('Media spend')).toHaveValue('')
    await user.click(screen.getByRole('tab', { name: /online/i }))
    expect(field('Media spend')).toHaveValue('1,000')
  })

  it('offers print, out-of-home and direct mail under Other offline', async () => {
    const user = setup()
    await user.click(screen.getByRole('tab', { name: /other offline/i }))
    await user.click(screen.getByRole('radio', { name: /direct mail/i }))
    expect(field('Campaign cost')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/directMail')
  })

  it('fills an example and resets it', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /try an example/i }))
    expect(field('Media spend')).toHaveValue('10,000')
    expect(within(screen.getByRole('region', { name: 'Results' })).getByText(/14 of 14 KPIs/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /reset/i }))
    expect(field('Media spend')).toHaveValue('')
  })

  it('exports the current category as CSV', async () => {
    const user = setup()
    const create = vi.fn<(b: Blob) => string>(() => 'blob:x')
    URL.createObjectURL = create as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await user.type(field('Media spend'), '1000')
    await user.click(screen.getByRole('button', { name: /export csv/i }))
    expect(click).toHaveBeenCalled()
    const text = await create.mock.calls[0][0].text()
    expect(text).toContain('Media spend,1000,EUR,entered')
  })

  it('opens print dialog for PDF', async () => {
    const user = setup()
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    await user.click(screen.getByRole('button', { name: /print \/ save as pdf/i }))
    expect(print).toHaveBeenCalled()
  })

  it('formats entered numbers with separators when not editing', async () => {
    const user = setup()
    await user.type(field('Impressions'), '2000000')
    expect(field('Impressions')).toHaveValue('2000000')
    await user.tab()
    expect(field('Impressions')).toHaveValue('2,000,000')
    await user.click(field('Impressions'))
    expect(field('Impressions')).toHaveValue('2000000')
  })

  it('explains conflicts next to the affected input', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /known rates/i }))
    await user.type(field('Media spend'), '1000')
    await user.type(field('Impressions'), '100000')
    await user.type(field('CPM'), '20')
    expect(field('CPM')).toHaveAccessibleDescription(/doesn't match/i)
  })

  it('says whether ROAS beats break-even', async () => {
    const user = setup()
    await user.type(field('Media spend'), '1000')
    await user.type(field('Attributed revenue'), '1500')
    await user.type(field('Contribution margin'), '30')
    expect(screen.getByText(/below break-even/i)).toBeInTheDocument()
    await user.clear(field('Attributed revenue'))
    await user.type(field('Attributed revenue'), '5000')
    expect(screen.getByText(/above break-even/i)).toBeInTheDocument()
  })

  it('lists entered inputs (including collapsed ones) in the print summary', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: /more inputs/i }))
    await user.type(field('Unique users reached'), '400000')
    await user.click(screen.getByRole('button', { name: /fewer inputs/i }))
    const table = screen.getByRole('table', { name: /your inputs/i })
    expect(within(table).getByText('Unique users reached')).toBeInTheDocument()
    expect(within(table).getByText('400,000')).toBeInTheDocument()
  })

  it('skip link focuses the calculator without changing the category', async () => {
    window.location.hash = '#/tv'
    const user = setup()
    await user.click(screen.getByRole('link', { name: /skip to calculator/i }))
    expect(screen.getByRole('tab', { name: /^tv/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  it('remembers a deep-linked offline sub-category', async () => {
    window.location.hash = '#/ooh'
    const user = setup()
    await user.click(screen.getByRole('tab', { name: /online/i }))
    await user.click(screen.getByRole('tab', { name: /other offline/i }))
    expect(screen.getByRole('radio', { name: /out-of-home/i })).toBeChecked()
  })

  it('applies an app update only when asked', async () => {
    pwa.needRefresh = true
    const update = vi.fn()
    pwa.update = update
    const user = setup()
    expect(screen.getByText(/new version is available/i)).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /later/i }))
    expect(screen.queryByText(/new version is available/i)).not.toBeInTheDocument()
    cleanupAndRender()
    await userEvent.click(screen.getByRole('button', { name: /reload and update/i }))
    expect(update).toHaveBeenCalledWith(true)
  })
})

function cleanupAndRender() {
  document.body.innerHTML = ''
  render(<App />)
}
