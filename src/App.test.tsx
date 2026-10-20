import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ offlineReady: [false, vi.fn()], needRefresh: [false, vi.fn()], updateServiceWorker: vi.fn() }),
}))

const setup = () => {
  const user = userEvent.setup()
  render(<App />)
  return user
}
const card = (name: string) => screen.getByRole('article', { name })
const field = (name: string) => screen.getByRole('textbox', { name })

beforeEach(() => {
  window.location.hash = ''
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
    expect(field('Media spend')).toHaveValue('1000')
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
    expect(field('Media spend')).toHaveValue('10000')
    expect(screen.getByText(/14 of 14 KPIs/)).toBeInTheDocument()
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
})
