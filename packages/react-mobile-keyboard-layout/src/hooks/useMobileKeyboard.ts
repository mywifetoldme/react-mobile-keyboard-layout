'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { isKeyboardTextInput } from '../utils/isKeyboardTextInput'

export type ActiveInputType = 'none' | 'floating' | 'body'

export interface UseMobileKeyboardOptions {
  /** Ref to the scrollable content container */
  bodyRef?: RefObject<HTMLElement | null>
  /** Threshold in pixels to treat viewport height contraction as keyboard opening. Default: 100 */
  keyboardThreshold?: number
  /** Duration in milliseconds for continuous rAF top-lock loop. Default: 350 */
  lockDurationMs?: number
  /** Whether to prevent rubber-banding on non-scrollable background areas. Default: false */
  preventOuterScroll?: boolean
}

export interface UseMobileKeyboardReturn {
  /** Dynamic container styles locking height to window.visualViewport.height */
  containerStyle: CSSProperties
  /** Whether the virtual keyboard is currently open */
  isKeyboardOpen: boolean
  /** Whether floating input should be hidden/suppressed due to body input focus */
  isFloatingSuppressed: boolean
  /** Grouped props to spread onto the floating input component */
  floatingProps: {
    onFocus: () => void
    onBlur: () => void
    onPointerDown: (e: ReactPointerEvent<HTMLElement> | PointerEvent) => void
  }
  /** Grouped props to spread onto the scrollable body container */
  bodyProps: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement> | PointerEvent) => void
  }
  /** Smoothly scroll feed to bottom and sync baseline closed anchor */
  scrollToBottom: (behavior?: ScrollBehavior) => void
}

/* ==========================================================================
   Pure Lifecycle & Geometry Helpers (Extracted from React Hooks)
   ========================================================================== */

const isTouchDevice = (): boolean => {
  return (
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)
  )
}

/**
 * 0.0px Coordinate Preservation Formula:
 * Delta_H = H_closed - H_current
 * S_new = S_0 + Delta_H
 */
const calculatePreservedScrollTop = (
  closedHeight: number | null,
  currHeight: number,
  closedScrollTop: number,
): number | null => {
  if (closedHeight !== null && closedHeight > currHeight) {
    const deltaH = closedHeight - currHeight
    return closedScrollTop + deltaH
  }
  return null
}

const subscribeVisualViewport = (
  vv: VisualViewport,
  threshold: number,
  onUpdate: (height: number, isOpen: boolean) => void,
) => {
  const handleUpdate = () => {
    const currentH = vv.height
    const screenH = window.innerHeight || currentH
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null
    const hasActiveTextInput = isKeyboardTextInput(activeEl)
    const isOpen = hasActiveTextInput && screenH - currentH > threshold && isTouchDevice()
    onUpdate(currentH, isOpen)
  }

  handleUpdate()
  const events = ['resize', 'scroll'] as const
  events.forEach((evt) => vv.addEventListener(evt, handleUpdate))

  return () => {
    events.forEach((evt) => vv.removeEventListener(evt, handleUpdate))
  }
}

interface CoordinateObserverMetrics {
  getClosedHeight: () => number | null
  setClosedHeight: (h: number) => void
  getClosedScrollTop: () => number
  setClosedScrollTop: (st: number) => void
  isKeyboardActive: () => boolean
  isBodyInputFocused: () => boolean
}

const createCoordinateObserver = (
  el: HTMLElement,
  metrics: CoordinateObserverMetrics,
) => {
  let isProgrammatic = false

  const handleScroll = () => {
    if (isProgrammatic || metrics.isKeyboardActive()) return
    metrics.setClosedScrollTop(el.scrollTop)
    metrics.setClosedHeight(el.clientHeight)
  }

  el.addEventListener('scroll', handleScroll, { passive: true })

  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const currHeight = entry.contentRect.height
      if (currHeight <= 0) continue

      if (!metrics.isKeyboardActive()) {
        metrics.setClosedHeight(currHeight)
        metrics.setClosedScrollTop(el.scrollTop)
      } else {
        // If a body input is focused, preserve natural scroll position without forcing synchronous jumps or deltaH addition
        if (metrics.isBodyInputFocused()) {
          return
        }

        const targetScrollTop = calculatePreservedScrollTop(
          metrics.getClosedHeight(),
          currHeight,
          metrics.getClosedScrollTop(),
        )
        if (targetScrollTop !== null) {
          isProgrammatic = true
          el.scrollTop = targetScrollTop
          requestAnimationFrame(() => {
            isProgrammatic = false
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
}

const bindBodyFocusListeners = (
  el: HTMLElement,
  onFocusIn: () => void,
  onFocusOut: () => void,
) => {
  const handleFocusIn = (e: FocusEvent) => {
    if (isKeyboardTextInput(e.target)) onFocusIn()
  }
  const handleFocusOut = (e: FocusEvent) => {
    if (isKeyboardTextInput(e.target)) onFocusOut()
  }

  el.addEventListener('focusin', handleFocusIn)
  el.addEventListener('focusout', handleFocusOut)
  return () => {
    el.removeEventListener('focusin', handleFocusIn)
    el.removeEventListener('focusout', handleFocusOut)
  }
}

const bindGlobalFocusOutListener = (onResetFocus: () => void) => {
  if (typeof window === 'undefined') return () => {}

  const handleGlobalFocusOut = (e: FocusEvent) => {
    if (isKeyboardTextInput(e.target)) {
      queueMicrotask(() => {
        const active = document.activeElement
        if (!active || active === document.body || !isKeyboardTextInput(active)) {
          onResetFocus()
        }
      })
    }
  }

  window.addEventListener('focusout', handleGlobalFocusOut)
  return () => window.removeEventListener('focusout', handleGlobalFocusOut)
}

const bindOuterScrollLock = (
  scrollableElement: HTMLElement | null,
  enabled: boolean,
) => {
  if (!enabled || typeof window === 'undefined') return () => {}

  const preventOuterTouchMove = (e: TouchEvent) => {
    const target = e.target as HTMLElement | null
    if (scrollableElement && scrollableElement.contains(target)) return
    if (e.cancelable) e.preventDefault()
  }

  window.addEventListener('touchmove', preventOuterTouchMove, { passive: false })
  return () => window.removeEventListener('touchmove', preventOuterTouchMove)
}

/* ==========================================================================
   Main Headless Hook (Declarative Orchestration Facade)
   ========================================================================== */

/**
 * useMobileKeyboard
 *
 * Zero-shift mobile keyboard layout engine with 0.0px scroll preservation.
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
  const activeInputTypeRef = useRef<ActiveInputType>('none')
  const [isBodyInputFocused, setIsBodyInputFocused] = useState<boolean>(false)

  // Frozen baseline coordinates
  const closedScrollTopRef = useRef<number>(0)
  const closedBodyHeightRef = useRef<number | null>(null)
  const isKeyboardActiveRef = useRef<boolean>(false)
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

  // 120Hz continuous window top-lock loop (clamps window.scrollY = 0)
  const startContinuousLockLoop = useCallback(
    (duration = lockDurationMs) => {
      if (typeof window === 'undefined') return
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
      lockLoopStartTimeRef.current = performance.now()

      const step = (now: number) => {
        if (window.scrollY !== 0 || document.documentElement.scrollTop !== 0 || document.body.scrollTop !== 0) {
          window.scrollTo(0, 0)
          document.documentElement.scrollTop = 0
          document.body.scrollTop = 0
        }
        if (now - lockLoopStartTimeRef.current < duration) {
          animationFrameIdRef.current = requestAnimationFrame(step)
        } else {
          animationFrameIdRef.current = null
        }
      }
      animationFrameIdRef.current = requestAnimationFrame(step)
    },
    [lockDurationMs],
  )

  // 1. VisualViewport subscription with synchronous baseline capture
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    return subscribeVisualViewport(
      vv,
      keyboardThreshold,
      (height, open) => {
        setVvHeight(height)
        setIsKeyboardOpen(open)

        const el = bodyRef?.current
        if (open) {
          if (!isKeyboardActiveRef.current) {
            isKeyboardActiveRef.current = true
            if (el) {
              closedScrollTopRef.current = el.scrollTop
              closedBodyHeightRef.current = el.clientHeight
            }
          }
          startContinuousLockLoop()
        } else {
          if (isKeyboardActiveRef.current) {
            startContinuousLockLoop()
            isKeyboardActiveRef.current = false
            if (el && !isBodyInputFocused) {
              el.scrollTop = closedScrollTopRef.current
            }
          }
        }
      },
    )
  }, [keyboardThreshold, startContinuousLockLoop, bodyRef, isBodyInputFocused])

  // 2. ResizeObserver & Coordinate Preservation
  useEffect(() => {
    const el = bodyRef?.current
    if (!el || typeof ResizeObserver === 'undefined') return
    return createCoordinateObserver(el, {
      getClosedHeight: () => closedBodyHeightRef.current,
      setClosedHeight: (h) => {
        closedBodyHeightRef.current = h
      },
      getClosedScrollTop: () => closedScrollTopRef.current,
      setClosedScrollTop: (st) => {
        closedScrollTopRef.current = st
      },
      isKeyboardActive: () => isKeyboardActiveRef.current,
      isBodyInputFocused: () => isBodyInputFocused,
    })
  }, [bodyRef, isBodyInputFocused])

  // 3. Focus Handover FSM (Body + Global)
  useEffect(() => {
    const el = bodyRef?.current
    const cleanupBody = el
      ? bindBodyFocusListeners(
          el,
          () => {
            activeInputTypeRef.current = 'body'
            setActiveInputType('body')
            setIsBodyInputFocused(true)
            startContinuousLockLoop()
          },
          () => {
            startContinuousLockLoop()
          },
        )
      : () => {}

    const cleanupGlobal = bindGlobalFocusOutListener(() => {
      const wasFloating = activeInputTypeRef.current === 'floating'
      activeInputTypeRef.current = 'none'
      setActiveInputType('none')
      setIsBodyInputFocused(false)
      if (isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = false
        setVvHeight(null)
        setIsKeyboardOpen(false)
        startContinuousLockLoop()
        if (wasFloating && bodyRef?.current) {
          bodyRef.current.scrollTop = closedScrollTopRef.current
        }
      }
    })

    return () => {
      cleanupBody()
      cleanupGlobal()
    }
  }, [bodyRef, startContinuousLockLoop])

  // 4. Optional touchmove clamp
  useEffect(() => {
    return bindOuterScrollLock(bodyRef?.current ?? null, preventOuterScroll)
  }, [bodyRef, preventOuterScroll])

  // Floating input handlers
  const handleFloatingFocus = useCallback(() => {
    activeInputTypeRef.current = 'floating'
    setActiveInputType('floating')
    setIsBodyInputFocused(false)
    startContinuousLockLoop()
  }, [startContinuousLockLoop])

  const handleFloatingBlur = useCallback(() => {
    startContinuousLockLoop()
  }, [startContinuousLockLoop])

  const handleFloatingPointerDown = useCallback(() => {
    startContinuousLockLoop()
  }, [startContinuousLockLoop])

  // Body pointerdown preventScroll handler
  const handleBodyPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement> | PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (target && isKeyboardTextInput(target)) {
        e.stopPropagation()
        startContinuousLockLoop()
        target.focus({ preventScroll: true })
      }
    },
    [startContinuousLockLoop],
  )

  // Smart bottom scroll helper
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const el = bodyRef?.current
      if (!el) return
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
      const closedHeight = closedBodyHeightRef.current ?? el.clientHeight
      closedScrollTopRef.current = Math.max(0, el.scrollHeight - closedHeight)
      el.scrollTo({ top: maxScroll, behavior })
    },
    [bodyRef],
  )

  const isFloatingSuppressed =
    activeInputType === 'body' && (isBodyInputFocused || isKeyboardOpen)

  const containerStyle: CSSProperties = vvHeight && isKeyboardOpen
    ? {
        height: `${vvHeight}px`,
        maxHeight: `${vvHeight}px`,
      }
    : {
        height: '100dvh',
        maxHeight: '100dvh',
      }

  return {
    containerStyle,
    isKeyboardOpen,
    isFloatingSuppressed,
    floatingProps: {
      onFocus: handleFloatingFocus,
      onBlur: handleFloatingBlur,
      onPointerDown: handleFloatingPointerDown,
    },
    bodyProps: {
      onPointerDown: handleBodyPointerDown,
    },
    scrollToBottom,
  }
}
