'use client'

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { isKeyboardTextInput } from '../utils/isKeyboardTextInput'

export type ActiveInputType = 'none' | 'floating' | 'body'

export interface UseMobileKeyboardOptions {
  /**
   * Ref to the scrollable content container.
   */
  bodyRef?: RefObject<HTMLElement | null>
  /**
   * Threshold in pixels to treat viewport height contraction as keyboard opening.
   * Default: 100
   */
  keyboardThreshold?: number
  /**
   * Duration in milliseconds for the continuous rAF top-lock loop during keyboard transition.
   * Default: 350
   */
  lockDurationMs?: number
  /**
   * Whether to prevent rubber-banding on non-scrollable background areas outside bodyRef.
   * Default: false (avoiding global window side-effects unless explicitly enabled).
   */
  preventOuterScroll?: boolean
}

export interface UseMobileKeyboardReturn {
  /** Dynamic container styles locking height to window.visualViewport.height */
  containerStyle: CSSProperties
  /** Whether the virtual keyboard is currently open */
  isKeyboardOpen: boolean
  /** Whether floating input should be hidden/suppressed due to body input focus */
  isFloatingSuppressed: boolean
  /** Whether a body input is actively focused */
  isBodyInputFocused: boolean
  /** Which input type currently owns focus */
  activeInputType: ActiveInputType
  /** Focus handler for floating input */
  handleFloatingFocus: () => void
  /** Blur handler for floating input */
  handleFloatingBlur: () => void
  /** Delegated pointerdown handler for scrollable body */
  handleBodyPointerDown: (e: React.PointerEvent<HTMLElement> | PointerEvent) => void
  /** Smoothly scroll feed to bottom and sync baseline closed anchor */
  scrollToBottom: (behavior?: ScrollBehavior) => void
  /** Imperatively lock window scroll position to top (0, 0) */
  lockToTop: () => void
}

/**
 * useMobileKeyboard
 *
 * Core zero-jerk mobile keyboard engine:
 * 1. 0.0px Coordinate Preservation Formula: S_new = S_0 + (H_closed - H_curr)
 * 2. 120Hz rAF Continuous Window Top-Lock Loop during keyboard slide animation
 * 3. 3-State Focus Handover State Machine (ActiveInputType: 'none' | 'floating' | 'body')
 * 4. Smart Bottom Scroll Anchor Synchronization
 */
export const useMobileKeyboard = ({
  bodyRef,
  keyboardThreshold = 100,
  lockDurationMs = 350,
  preventOuterScroll = false,
}: UseMobileKeyboardOptions = {}): UseMobileKeyboardReturn => {
  const [vvHeight, setVvHeight] = useState<number | null>(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      return window.visualViewport.height
    }
    return null
  })
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false)
  const [activeInputType, setActiveInputType] = useState<ActiveInputType>('none')
  const [isBodyInputFocused, setIsBodyInputFocused] = useState<boolean>(false)

  // Baseline frozen metrics when keyboard is closed
  const closedScrollTopRef = useRef<number>(0)
  const closedBodyHeightRef = useRef<number | null>(null)
  const isKeyboardActiveRef = useRef<boolean>(false)
  const isProgrammaticScrollRef = useRef<boolean>(false)
  const animationFrameIdRef = useRef<number | null>(null)
  const lockLoopStartTimeRef = useRef<number>(0)

  // Global unmount cleanup
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [])

  // 1. Continuous rAF Top-Lock Loop (Clamps window.scrollY = 0 during keyboard transitions)
  const startContinuousLockLoop = (duration = lockDurationMs) => {
    if (typeof window === 'undefined') return
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current)
    }
    lockLoopStartTimeRef.current = performance.now()

    const step = (now: number) => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
      if (now - lockLoopStartTimeRef.current < duration) {
        animationFrameIdRef.current = requestAnimationFrame(step)
      } else {
        animationFrameIdRef.current = null
      }
    }
    animationFrameIdRef.current = requestAnimationFrame(step)
  }

  // 2. Track visualViewport height and keyboard open/close state
  useEffect(() => {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    if (!vv) return

    const isTouchDevice =
      typeof navigator !== 'undefined' &&
      (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)

    const handleResize = () => {
      const currentH = vv.height
      setVvHeight(currentH)

      const screenH = window.innerHeight || currentH
      const diff = screenH - currentH

      // Only flag keyboard on touch devices or when an input is actively engaged
      const open =
        diff > keyboardThreshold &&
        (isTouchDevice || activeInputType !== 'none' || isBodyInputFocused)

      setIsKeyboardOpen(open)

      if (open) {
        startContinuousLockLoop(lockDurationMs)
      }
    }

    handleResize()
    vv.addEventListener('resize', handleResize)
    vv.addEventListener('scroll', handleResize)
    return () => {
      vv.removeEventListener('resize', handleResize)
      vv.removeEventListener('scroll', handleResize)
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [keyboardThreshold, lockDurationMs, activeInputType, isBodyInputFocused])

  // 3. Absolute Coordinate Estimation with Frozen Base Values (0.0px exact anchor)
  useEffect(() => {
    const el = bodyRef?.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current || !el) return
      if (!isKeyboardActiveRef.current) {
        closedScrollTopRef.current = el.scrollTop
        closedBodyHeightRef.current = el.clientHeight
      }
    }

    el.addEventListener('scroll', handleScroll, { passive: true })

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const currHeight = entry.contentRect.height
        if (currHeight <= 0) continue

        if (!isKeyboardActiveRef.current) {
          closedBodyHeightRef.current = currHeight
          closedScrollTopRef.current = el.scrollTop
        } else {
          // Dynamic viewport contraction adjustment:
          // As container shrinks by deltaH, increase scrollTop by deltaH to anchor pixel row motionless.
          if (closedBodyHeightRef.current !== null && closedBodyHeightRef.current > currHeight) {
            const deltaH = closedBodyHeightRef.current - currHeight
            const targetScrollTop = closedScrollTopRef.current + deltaH
            isProgrammaticScrollRef.current = true
            el.scrollTop = targetScrollTop
            requestAnimationFrame(() => {
              isProgrammaticScrollRef.current = false
            })
          }
        }
      }
    })

    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', handleScroll)
      ro.disconnect()
    }
  }, [bodyRef])

  // 4. Capture native focus events inside the scrollable body
  useEffect(() => {
    const el = bodyRef?.current
    if (!el) return

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (target && isKeyboardTextInput(target)) {
        setActiveInputType('body')
        setIsBodyInputFocused(true)
        startContinuousLockLoop(lockDurationMs)
      }
    }

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (target && isKeyboardTextInput(target)) {
        startContinuousLockLoop(lockDurationMs)
      }
    }

    el.addEventListener('focusin', handleFocusIn)
    el.addEventListener('focusout', handleFocusOut)
    return () => {
      el.removeEventListener('focusin', handleFocusIn)
      el.removeEventListener('focusout', handleFocusOut)
    }
  }, [bodyRef, lockDurationMs])

  // 5. Global focusout listener to reset input ownership when clicking backdrop
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleGlobalFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (target && isKeyboardTextInput(target)) {
        setTimeout(() => {
          const active = document.activeElement
          if (!active || active === document.body) {
            setActiveInputType('none')
            setIsBodyInputFocused(false)
          }
        }, 50)
      }
    }

    window.addEventListener('focusout', handleGlobalFocusOut)
    return () => window.removeEventListener('focusout', handleGlobalFocusOut)
  }, [])

  // 6. Sync keyboard open/close transitions with exact position restoration
  useEffect(() => {
    const el = bodyRef?.current
    if (!el) return

    if (isKeyboardOpen) {
      if (!isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = true
        closedScrollTopRef.current = el.scrollTop
        closedBodyHeightRef.current = el.clientHeight
      }
    } else {
      if (isKeyboardActiveRef.current) {
        startContinuousLockLoop(lockDurationMs)
        isKeyboardActiveRef.current = false
        if (!isBodyInputFocused) {
          isProgrammaticScrollRef.current = true
          el.scrollTop = closedScrollTopRef.current
          requestAnimationFrame(() => {
            isProgrammaticScrollRef.current = false
          })
        }
      }
    }
  }, [bodyRef, isKeyboardOpen, isBodyInputFocused, lockDurationMs])

  // 7. Floating input focus/blur handlers
  const handleFloatingFocus = () => {
    setActiveInputType('floating')
    setIsBodyInputFocused(false)
    startContinuousLockLoop(lockDurationMs)
  }

  const handleFloatingBlur = () => {
    startContinuousLockLoop(lockDurationMs)
  }

  // 8. Prevent iOS Safari auto-scroll jump when tapping text inputs in body
  const handleBodyPointerDown = (e: React.PointerEvent<HTMLElement> | PointerEvent) => {
    const target = e.target as HTMLElement | null
    if (target && isKeyboardTextInput(target)) {
      e.stopPropagation()
      startContinuousLockLoop(lockDurationMs)
      target.focus({ preventScroll: true })
    }
  }

  // 9. Manual lockToTop helper
  const lockToTop = () => {
    if (typeof window !== 'undefined' && window.scrollY !== 0) {
      window.scrollTo(0, 0)
    }
  }

  // 10. Optional touchmove clamp (only active if preventOuterScroll is explicitly enabled)
  useEffect(() => {
    if (!preventOuterScroll || typeof window === 'undefined') return

    const preventOuterTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null
      const scrollableBody = bodyRef?.current
      if (scrollableBody && scrollableBody.contains(target)) {
        return
      }
      if (e.cancelable) {
        e.preventDefault()
      }
    }

    window.addEventListener('touchmove', preventOuterTouchMove, { passive: false })
    return () => window.removeEventListener('touchmove', preventOuterTouchMove)
  }, [bodyRef, preventOuterScroll])

  // 11. Smart bottom scroll helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = bodyRef?.current
    if (!el) return
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
    isProgrammaticScrollRef.current = true
    const closedHeight = closedBodyHeightRef.current ?? el.clientHeight
    closedScrollTopRef.current = Math.max(0, el.scrollHeight - closedHeight)
    el.scrollTo({ top: maxScroll, behavior })
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false
    })
  }

  // Floating input is ONLY suppressed if the body input is the active focus owner
  const isFloatingSuppressed =
    activeInputType === 'body' && (isBodyInputFocused || isKeyboardOpen)

  const containerStyle: CSSProperties = vvHeight
    ? {
        height: `${vvHeight}px`,
        maxHeight: `${vvHeight}px`,
        paddingBottom: isKeyboardOpen ? '0px' : undefined,
      }
    : {}

  return {
    containerStyle,
    isKeyboardOpen,
    isFloatingSuppressed,
    isBodyInputFocused,
    activeInputType,
    handleFloatingFocus,
    handleFloatingBlur,
    handleBodyPointerDown,
    scrollToBottom,
    lockToTop,
  }
}
