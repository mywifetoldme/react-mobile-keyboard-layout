import { describe, it, expect } from 'vitest'
import { calculatePreservedScrollTop } from './layoutRules'

describe('calculatePreservedScrollTop', () => {
  it('returns null if closedHeight is null', () => {
    expect(calculatePreservedScrollTop(null, 500, 100)).toBeNull()
  })

  it('returns null when closedHeight < currHeight (viewport expanded / keyboard not open)', () => {
    expect(calculatePreservedScrollTop(600, 700, 100)).toBeNull()
  })

  it('returns null at exact boundary where closedHeight === currHeight (no contraction)', () => {
    expect(calculatePreservedScrollTop(600, 600, 100)).toBeNull()
    expect(calculatePreservedScrollTop(844, 844, 0)).toBeNull()
  })

  it('calculates preserved scrollTop correctly when closedHeight > currHeight (keyboard ascended)', () => {
    // Delta_H = 600 - 350 = 250
    // S_new = 100 + 250 = 350
    expect(calculatePreservedScrollTop(600, 350, 100)).toBe(350)

    // With 0 initial scroll
    expect(calculatePreservedScrollTop(800, 500, 0)).toBe(300)
  })

  it('handles floating point subpixel values with high mathematical precision', () => {
    // closedHeight: 844.5, currHeight: 508.33, closedScrollTop: 120.25
    // Delta_H = 844.5 - 508.33 = 336.17
    // Expected: 120.25 + 336.17 = 456.42
    const result = calculatePreservedScrollTop(844.5, 508.33, 120.25)
    expect(result).not.toBeNull()
    expect(result!).toBeCloseTo(456.42, 5)
  })

  it('calculates Delta_H correctly for 1px contraction boundary', () => {
    expect(calculatePreservedScrollTop(600, 599, 50)).toBe(51)
  })
})
