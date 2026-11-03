import { describe, expect, it } from 'vitest'
import { formatInput, parseInputs } from './inputs'

describe('formatInput', () => {
  it.each([
    ['2000000', '2.000.000'],
    ['1234,5', '1.234,5'],
    ['1234.5', '1.234,5'],
    ['1.500', '1.500'],
    ['2.4', '2,4'],
    ['abc', 'abc'],
    ['1,2,3', '1,2,3'],
    ['1e-11', '1e-11'],
    ['0,000001234', '0,000001234'],
  ])('%j -> %j', (raw, shown) => expect(formatInput(raw)).toBe(shown))
})

describe('parseInputs', () => {
  it('asks for a number in German notation when input is invalid', () => {
    expect(parseInputs({ spend: '1.23,4' }).errors.spend).toBe('Gib eine Zahl ein, z. B. 1.234,56')
  })
  it('reads German notation into values', () => {
    expect(parseInputs({ spend: '1.234,56 €', margin: '30 %' }).values).toEqual({ spend: 1234.56, margin: 30 })
  })
  it('reports bounds errors in German', () => {
    expect(parseInputs({ reachPct: '120' }).errors.reachPct).toBe('Netto-Reichweite darf nicht größer als 100 % sein.')
  })
})
