import { describe, it, expect } from 'vitest'
import { calculateSafeZoneAdjustment } from './safeZone'

describe('calculateSafeZoneAdjustment', () => {
  const viewportHeight = 844 // standard iPhone height
  const options = {
    headerHeight: 56,
    estimatedKeyboardHeight: 336,
    margin: 16,
  }
  // safeTop = 56 + 16 = 72
  // safeBottom = 844 - 336 - 16 = 492

  it('returns 0 when element is already in the safe zone', () => {
    const delta = calculateSafeZoneAdjustment(
      { top: 100, bottom: 140 },
      viewportHeight,
      options,
    )
    expect(delta).toBe(0)
  })

  it('returns negative delta when element is obscured under the header', () => {
    // element top is at 30px (< 72px)
    const delta = calculateSafeZoneAdjustment(
      { top: 30, bottom: 70 },
      viewportHeight,
      options,
    )
    expect(delta).toBe(-42) // 30 - 72 = -42 (scroll container up by 42px)
  })

  it('returns positive delta when element is in the bottom danger zone', () => {
    // element bottom is at 600px (> 492px)
    const delta = calculateSafeZoneAdjustment(
      { top: 560, bottom: 600 },
      viewportHeight,
      options,
    )
    expect(delta).toBe(108) // 600 - 492 = 108 (scroll container down by 108px)
  })
})
