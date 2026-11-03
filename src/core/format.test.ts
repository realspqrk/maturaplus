import { describe, expect, it } from 'vitest'
import { formatValue, parseNumber } from './format'

describe('parseNumber', () => {
  it.each([
    ['1234', 1234],
    ['1.234,5', 1234.5],
    ['1234,5', 1234.5],
    ['1.500', 1500],
    ['1.234.567', 1234567],
    ['1.234.567,89', 1234567.89],
    ['0,5', 0.5],
    [',5', 0.5],
    ['12,', 12],
    [' 2 500 ', 2500],
    // a lone dot that is not a thousands group is a decimal point
    ['2.4', 2.4],
    ['0.5', 0.5],
    ['.5', 0.5],
    ['1.23', 1.23],
    ['1234.5', 1234.5],
    ['1.2345', 1.2345],
    ['1.000 €', 1000],
    ['1.000€', 1000],
    ['€ 1.000', 1000],
    ['€1.000', 1000],
    ['1.234,56 €', 1234.56],
    ['12,5%', 12.5],
    ['12,5 %', 12.5],
    ['12.5%', 12.5],
    ['1e3', 1000],
    ['-3', -3],
    ['-1.234,5', -1234.5],
    ['-€50', -50],
    ['-50 €', -50],
    ['50 %', 50],
  ])('parses %j as %d', (raw, expected) => {
    expect(parseNumber(raw)).toBe(expected)
  })

  it.each([
    '', '   ', 'abc', '1,2,3', '1.23,4', '12.34,5', '1.2.3', '1,234.5', '1,2,3,4x', '--1', 'NaN', 'Infinity',
    '1%2', '1e%3', '€€5', '€5€', ',', '-,', '%5', '5%€', '1 2%3', '1.2345,6',
  ])('rejects %j', (raw) => {
    expect(parseNumber(raw)).toBeUndefined()
  })
})

describe('formatValue', () => {
  it('formats currency in EUR', () => {
    expect(formatValue(1234.5, 'currency')).toBe('1.234,50 €')
  })
  it('keeps precision for small currency amounts like CPC', () => {
    expect(formatValue(0.0042, 'currency')).toBe('0,0042 €')
  })
  it('formats percent values stored as percentage points', () => {
    expect(formatValue(2.5, 'percent')).toBe('2,5 %')
    expect(formatValue(12.5, 'percent')).toBe('12,5 %')
  })
  it('formats counts without decimals', () => {
    expect(formatValue(1234567.4, 'count')).toBe('1.234.567')
    expect(formatValue(2_000_000, 'count')).toBe('2.000.000')
  })
  it('formats ratios with an x suffix', () => {
    expect(formatValue(3.456, 'ratio')).toBe('3,46×')
    expect(formatValue(10 / 3, 'ratio')).toBe('3,33×')
  })
  it('formats rating points', () => {
    expect(formatValue(120.25, 'points')).toBe('120,3')
  })
})
