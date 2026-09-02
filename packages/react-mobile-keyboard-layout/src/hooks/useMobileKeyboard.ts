'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type {
  UseMobileKeyboardOptions,
  UseMobileKeyboardReturn,
  LayoutState,
} from '../core/layoutTypes'
import { LayoutEngine } from '../core/layoutEngine'

export type { UseMobileKeyboardOptions, UseMobileKeyboardReturn } from '../core/layoutTypes'

/* ==========================================================================
   Main Headless Hook (Delegates to Declarative Reference-Driven LayoutEngine)
   ========================================================================== */

/**
 * useMobileKeyboard
 *
 * Zero-shift mobile keyboard layout engine with 0.0px scroll preservation
 * powered by a declarative reference-driven Rule Engine & FSM.
 */
export const useMobileKeyboard = ({
  bodyRef,
  keyboardThreshold = 100,
  lockDurationMs = 350,
  preventOuterScroll = false,
}: UseMobileKeyboardOptions = {}): UseMobileKeyboardReturn => {
  const floatingRef = useRef<HTMLElement | null>(null)

  // Maintain reactive state synchronized with LayoutEngine
  const [, setRenderTick] = useState(0)

  const engineRef = useRef<LayoutEngine | null>(null)
  if (!engineRef.current) {
    engineRef.current = new LayoutEngine({
      refs: { bodyRef, floatingRef },
      keyboardThreshold,
      lockDurationMs,
      onStateChange: () => setRenderTick((t) => t + 1),
    })
  }

  const engine = engineRef.current

  // Keep DOM refs up to date on each render
  useEffect(() => {
    engine.setRefs({ bodyRef, floatingRef })
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engine.destroy()
    }
  }, [engine])

  // 1. Subscribe to VisualViewport (resize & scroll)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport

    const handleVvResize = (e: Event) => engine.dispatch('visualViewport.resize', e)
    const handleVvScroll = (e: Event) => engine.dispatch('visualViewport.scroll', e)

    vv.addEventListener('resize', handleVvResize)
    vv.addEventListener('scroll', handleVvScroll)

    // Initial check
    engine.dispatch('visualViewport.resize', new Event('resize'))

    return () => {
      vv.removeEventListener('resize', handleVvResize)
      vv.removeEventListener('scroll', handleVvScroll)
    }
  }, [engine])

  // 2. Subscribe to Body ResizeObserver & Scroll
  useEffect(() => {
    const el = bodyRef?.current
    if (!el) return

    const handleScroll = (e: Event) => engine.dispatch('scroll', e)
    el.addEventListener('scroll', handleScroll, { passive: true })

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          engine.dispatch('resize', entry)
        }
      })
      ro.observe(el)
    }

    return () => {
      el.removeEventListener('scroll', handleScroll)
      ro?.disconnect()
    }
  }, [bodyRef, engine])

  // 3. Subscribe to Body Inline FocusIn
  useEffect(() => {
    const el = bodyRef?.current
    if (!el) return

    const handleFocusIn = (e: FocusEvent) => {
      engine.dispatch('focusin', e)
    }

    el.addEventListener('focusin', handleFocusIn)
    return () => el.removeEventListener('focusin', handleFocusIn)
  }, [bodyRef, engine])

  // 4. Subscribe to Window Global FocusOut (Loss of Focus / Dismissal)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleGlobalFocusOut = (e: FocusEvent) => {
      queueMicrotask(() => {
        engine.dispatch('focusout', e)
      })
    }

    window.addEventListener('focusout', handleGlobalFocusOut)
    return () => window.removeEventListener('focusout', handleGlobalFocusOut)
  }, [engine])

  // 5. Optional Outer TouchMove Scroll Lock
  useEffect(() => {
    if (!preventOuterScroll || typeof window === 'undefined') return

    const preventOuterTouchMove = (e: TouchEvent) => {
      const scrollable = bodyRef?.current
      const target = e.target as HTMLElement | null
      if (scrollable && scrollable.contains(target)) return
      if (e.cancelable) e.preventDefault()
    }

    window.addEventListener('touchmove', preventOuterTouchMove, { passive: false })
    return () => window.removeEventListener('touchmove', preventOuterTouchMove)
  }, [bodyRef, preventOuterScroll])

  // Floating Input Props Handlers
  const handleFloatingFocus = useCallback(
    () => {
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null
      engine.dispatch('focusin', { target: activeEl ?? floatingRef.current })
    },
    [engine],
  )

  const handleFloatingBlur = useCallback(() => {
    engine.lockWindowTop()
  }, [engine])

  const handleFloatingPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement> | PointerEvent) => {
      engine.lockWindowTop()
      if (e.target) {
        floatingRef.current = (e.target as HTMLElement).closest('.rmkl-floating-input-wrapper') ?? (e.target as HTMLElement)
      }
    },
    [engine],
  )

  // Body Props Handlers
  const handleBodyPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement> | PointerEvent) => {
      engine.dispatch('pointerdown', e)
    },
    [engine],
  )

  const state: LayoutState = engine.getState()

  const isFloatingSuppressed =
    state.focusTarget.type === 'body-inline' &&
    (state.isKeyboardOpen || (typeof document !== 'undefined' && document.activeElement?.tagName === 'INPUT'))

  const headerStyle: CSSProperties = state.vvOffsetTop > 0 && state.isKeyboardOpen
    ? {
        transform: `translate3d(0, ${state.vvOffsetTop}px, 0)`,
        WebkitTransform: `translate3d(0, ${state.vvOffsetTop}px, 0)`,
      }
    : {}

  const containerStyle: CSSProperties = state.vvHeight && state.isKeyboardOpen
    ? {
        height: `${state.vvHeight}px`,
        maxHeight: `${state.vvHeight}px`,
        ...(state.vvOffsetTop > 0 ? {
          transform: `translate3d(0, ${state.vvOffsetTop}px, 0)`,
          WebkitTransform: `translate3d(0, ${state.vvOffsetTop}px, 0)`,
        } : {}),
      }
    : {
        height: '100dvh',
        maxHeight: '100dvh',
      }

  return {
    containerStyle,
    headerStyle,
    isKeyboardOpen: state.isKeyboardOpen,
    isFloatingSuppressed,
    floatingProps: {
      onFocus: handleFloatingFocus,
      onBlur: handleFloatingBlur,
      onPointerDown: handleFloatingPointerDown,
    },
    bodyProps: {
      onPointerDown: handleBodyPointerDown,
    },
    scrollToBottom: engine.scrollToBottom,
  }
}
