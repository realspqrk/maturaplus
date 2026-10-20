import { describe, expect, it } from 'vitest'
import { formatInput } from './inputs'

describe('formatInput', () => {
  it.each([
    ['2000000', '2,000,000'],
    ['1234.5', '1,234.5'],
    ['abc', 'abc'],
    ['1e-11', '1e-11'],
    ['0.000001234', '0.000001234'],
  ])('%j -> %j', (raw, shown) => expect(formatInput(raw)).toBe(shown))
})
