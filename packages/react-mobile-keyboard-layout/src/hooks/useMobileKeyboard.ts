'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import { isKeyboardTextInput } from '../utils/isKeyboardTextInput'

/** CSS custom property that carries the keyboard-covered height, e.g. `337px` (`0px` while closed). */
export const KEYBOARD_HEIGHT_CSS_VAR = '--rmkl-kb'

export interface UseMobileKeyboardOptions {
  /** Ref to the scrollable content container */
  bodyRef?: RefObject<HTMLElement | null>
  /** Threshold in pixels to treat viewport height contraction as keyboard opening. Default: 100 */
  keyboardThreshold?: number
  /** Duration in milliseconds of the fallback rAF top-lock loop started on tap. Default: 350 */
  lockDurationMs?: number
  /** Whether to prevent rubber-banding on non-scrollable background areas. Default: false */
  preventOuterScroll?: boolean
}

export interface UseMobileKeyboardReturn {
  /** Reserves the keyboard-covered height as bottom padding (SubpageLayout does the same in CSS) */
  containerStyle: CSSProperties
  /** Whether the virtual keyboard is currently open */
  isKeyboardOpen: boolean
  /** Grouped props to spread onto the floating input component */
  floatingProps: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement> | PointerEvent) => void
  }
  /** Grouped props to spread onto the scrollable body container */
  bodyProps: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement> | PointerEvent) => void
  }
  /** Scroll the body to its end (the newest message in a chat) */
  scrollToBottom: (behavior?: ScrollBehavior) => void
}

const INPUT_SELECTOR = 'input, textarea, [contenteditable]'

/** How much of the layout viewport the keyboard covers right now. */
const measureKeyboardHeight = (): number => {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, Math.round(window.innerHeight - vv.height))
}

/**
 * useMobileKeyboard
 *
 * Keeps the header and the reading position still while the iOS keyboard opens.
 * Keyboard state (open? which input? native picker?) is decided by CSS selectors in
 * SubpageLayout.css. This hook only does the three things CSS cannot:
 *  1. publish the keyboard-covered height as a CSS variable (`--rmkl-kb`), and reveal the focused
 *     body input if the shorter box hid it
 *  2. focus tapped text inputs itself, before iOS pans the window to reveal them
 *  3. a short rAF top-lock as a fallback for 2.
 */
export const useMobileKeyboard = ({
  bodyRef,
  keyboardThreshold = 100,
  lockDurationMs = 350,
  preventOuterScroll = false,
}: UseMobileKeyboardOptions = {}): UseMobileKeyboardReturn => {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const rafIdRef = useRef<number | null>(null)

  // 1. Keyboard height → CSS variable + state
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    const root = document.documentElement

    const update = () => {
      const measured = measureKeyboardHeight()
      const height = measured >= keyboardThreshold ? measured : 0
      root.style.setProperty(KEYBOARD_HEIGHT_CSS_VAR, `${height}px`)
      setKeyboardHeight(height)

      // The body just lost `height` px at the bottom while the tap above focused without scrolling:
      // if the focused body input ended up outside the shorter box, reveal it (a no-op when visible)
      const active = document.activeElement
      if (height > 0 && bodyRef?.current?.contains(active) && isKeyboardTextInput(active)) {
        requestAnimationFrame(() => (active as HTMLElement).scrollIntoView?.({ block: 'nearest' }))
      }
    }

    vv.addEventListener('resize', update)
    update()
    return () => {
      vv.removeEventListener('resize', update)
      root.style.removeProperty(KEYBOARD_HEIGHT_CSS_VAR)
    }
  }, [bodyRef, keyboardThreshold])

  // 3. Fallback lock: undo any window pan iOS still performs during the keyboard animation
  const cancelLock = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  const lockWindowTop = useCallback(() => {
    if (typeof window === 'undefined') return
    cancelLock()
    const startedAt = performance.now()
    const step = (now: number) => {
      if (window.scrollY !== 0) window.scrollTo(0, 0)
      rafIdRef.current = now - startedAt < lockDurationMs ? requestAnimationFrame(step) : null
    }
    rafIdRef.current = requestAnimationFrame(step)
  }, [cancelLock, lockDurationMs])

  // The lock is only meaningful while an input is focused: stop it on blur and on unmount
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('focusout', cancelLock)
    return () => {
      window.removeEventListener('focusout', cancelLock)
      cancelLock()
    }
  }, [cancelLock])

  // Optional: block rubber-banding outside the scrollable body
  useEffect(() => {
    if (!preventOuterScroll || typeof window === 'undefined') return
    const preventOuterTouchMove = (e: TouchEvent) => {
      const scrollable = bodyRef?.current
      if (scrollable && scrollable.contains(e.target as Node | null)) return
      if (e.cancelable) e.preventDefault()
    }
    window.addEventListener('touchmove', preventOuterTouchMove, { passive: false })
    return () => window.removeEventListener('touchmove', preventOuterTouchMove)
  }, [bodyRef, preventOuterScroll])

  // 2. Tap interception — focus text inputs ourselves, without the scroll iOS would add.
  //    Native pickers (date/time/select) and buttons keep their default action untouched.
  const handleBodyPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement> | PointerEvent) => {
      const target = e.target instanceof Element ? e.target.closest(INPUT_SELECTOR) : null
      if (!isKeyboardTextInput(target)) return
      const input = target as HTMLElement
      input.focus({ preventScroll: true })
      lockWindowTop()
    },
    [lockWindowTop],
  )

  // FloatingInput already focuses its textarea with preventScroll on pointerdown; only the fallback lock is needed
  const handleFloatingPointerDown = useCallback(() => lockWindowTop(), [lockWindowTop])

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const el = bodyRef?.current
      if (!el) return
      const reversed = getComputedStyle(el).flexDirection === 'column-reverse'
      el.scrollTo({ top: reversed ? 0 : Math.max(0, el.scrollHeight - el.clientHeight), behavior })
    },
    [bodyRef],
  )

  return {
    containerStyle: { paddingBottom: `${keyboardHeight}px`, boxSizing: 'border-box' },
    isKeyboardOpen: keyboardHeight > 0,
    floatingProps: { onPointerDown: handleFloatingPointerDown },
    bodyProps: { onPointerDown: handleBodyPointerDown },
    scrollToBottom,
  }
}
