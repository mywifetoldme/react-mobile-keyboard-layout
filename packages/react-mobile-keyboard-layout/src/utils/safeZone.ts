/**
 * Pure Safe-Zone Geometry Calculator & Alignment Utility
 *
 * Aligns a focused element within the inner scrollable container (<main>)
 * so its bounding rect falls strictly within the safe visible viewport:
 *
 *   Safe Top:    headerHeight (default: 56px)
 *   Safe Bottom: viewportHeight - estimatedKeyboardHeight (default: 336px)
 *
 * When an input is inside the Safe Zone, Safari's WebKit tap engine determines
 * that the input is fully visible and DOES NOT pan window.scrollY.
 */

export interface SafeZoneOptions {
  headerHeight?: number
  estimatedKeyboardHeight?: number
  margin?: number
}

export const calculateSafeZoneAdjustment = (
  elementRect: { top: number; bottom: number },
  viewportHeight: number,
  options: SafeZoneOptions = {},
): number => {
  const {
    headerHeight = 56,
    estimatedKeyboardHeight = 336,
    margin = 16,
  } = options

  const safeTop = headerHeight + margin
  const safeBottom = Math.max(safeTop + 40, viewportHeight - estimatedKeyboardHeight - margin)

  // 1. Element is obscured above / behind top header
  if (elementRect.top < safeTop) {
    return elementRect.top - safeTop // Negative delta: scroll container UP (reduce scrollTop)
  }

  // 2. Element is in the bottom danger zone (would be covered by keyboard)
  if (elementRect.bottom > safeBottom) {
    return elementRect.bottom - safeBottom // Positive delta: scroll container DOWN (increase scrollTop)
  }

  // 3. Already in the Safe Zone
  return 0
}

export const alignElementToSafeZone = (
  element: HTMLElement | null,
  container: HTMLElement | null,
  options: SafeZoneOptions = {},
): boolean => {
  if (!element || !container || typeof window === 'undefined') return false

  const rect = element.getBoundingClientRect()
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight

  const delta = calculateSafeZoneAdjustment(
    { top: rect.top, bottom: rect.bottom },
    viewportHeight,
    options,
  )

  if (delta !== 0) {
    container.scrollTop = Math.max(0, container.scrollTop + delta)
    return true
  }

  return false
}
