import { describe, expect, it } from 'vitest'
import { formatValue, parseNumber } from './format'

describe('parseNumber', () => {
  it.each([
    ['1234', 1234],
    ['1,234.5', 1234.5],
    [' 2 500 ', 2500],
    ['0.5', 0.5],
    ['.5', 0.5],
    ['€1,000', 1000],
    ['12.5%', 12.5],
    ['1e3', 1000],
    ['-3', -3],
    ['€ 1,000', 1000],
    ['-€50', -50],
    ['50 %', 50],
  ])('parses %j as %d', (raw, expected) => {
    expect(parseNumber(raw)).toBe(expected)
  })

  it.each(['', '   ', 'abc', '1.2.3', '1,2,3,4x', '--1', 'NaN', 'Infinity', '1%2', '1e%3', '€€5', '5€', '%5', '1 2%3'])('rejects %j', (raw) => {
    expect(parseNumber(raw)).toBeUndefined()
  })
})

describe('formatValue', () => {
  it('formats currency in EUR', () => {
    expect(formatValue(1234.5, 'currency')).toBe('€1,234.50')
  })
  it('keeps precision for small currency amounts like CPC', () => {
    expect(formatValue(0.0042, 'currency')).toBe('€0.0042')
  })
  it('formats percent values stored as percentage points', () => {
    expect(formatValue(2.5, 'percent')).toBe('2.5%')
  })
  it('formats counts without decimals', () => {
    expect(formatValue(1234567.4, 'count')).toBe('1,234,567')
  })
  it('formats ratios with an x suffix', () => {
    expect(formatValue(3.456, 'ratio')).toBe('3.46×')
  })
  it('formats rating points', () => {
    expect(formatValue(120.25, 'points')).toBe('120.3')
  })
})
