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

/** CSS custom property with the keyboard height in px (`0px` while closed), in every browser. */
export const KEYBOARD_HEIGHT_CSS_VAR = '--rmkl-kb'
/**
 * CSS custom property with the part of the layout viewport the keyboard covers. Safari keeps the
 * layout viewport and shrinks the visual one, so this equals the keyboard height; browsers that
 * resize the layout viewport itself (Chrome for iOS, Android) report `0px` — nothing is covered.
 */
export const KEYBOARD_INSET_CSS_VAR = '--rmkl-kb-inset'

export interface UseMobileKeyboardOptions {
  /** Ref to the scrollable content container */
  bodyRef?: RefObject<HTMLElement | null>
  /** Threshold in pixels to treat viewport height contraction as keyboard opening. Default: 100 */
  keyboardThreshold?: number
  /** Duration in milliseconds of the fallback rAF top-lock loop started on tap and on blur. Default: 350 */
  lockDurationMs?: number
  /** Whether to prevent rubber-banding on non-scrollable background areas. Default: false */
  preventOuterScroll?: boolean
}

export interface UseMobileKeyboardReturn {
  /** Reserves the keyboard-covered part of the layout viewport as bottom padding (SubpageLayout does the same in CSS) */
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
/** After a body input blurs, the body still changes size (padding, keyboard leaving) for this long */
const BLUR_GRACE_MS = 1000

const isBottomAnchored = (el: HTMLElement) => getComputedStyle(el).flexDirection === 'column-reverse'

/** Bodies already kept still by a hook instance — a second instance on the same body (SubpageLayout's own
 *  hook next to the caller's) must not correct the scroll offset twice. */
const keptBodies = new WeakSet<HTMLElement>()

const isFocusedBodyInput = (body: HTMLElement | null | undefined, el: EventTarget | Element | null) =>
  !!body && el instanceof Node && body.contains(el) && isKeyboardTextInput(el)

/**
 * useMobileKeyboard
 *
 * Keeps the header and the reading position still while the mobile keyboard opens.
 * Keyboard state (open? which input? native picker?) is decided by CSS selectors in
 * SubpageLayout.css. This hook only does what CSS cannot:
 *  1. publish the keyboard height (`--rmkl-kb`) and the covered inset (`--rmkl-kb-inset`) as CSS variables
 *  2. keep a focused body input where it is while the body changes size (a column-reverse body
 *     would move it), and reveal it if the keyboard hides it
 *  3. focus tapped text inputs itself, before iOS pans the window to reveal them
 *  4. a short rAF top-lock as a fallback for 3., on tap and on blur
 */
export const useMobileKeyboard = ({
  bodyRef,
  keyboardThreshold = 100,
  lockDurationMs = 350,
  preventOuterScroll = false,
}: UseMobileKeyboardOptions = {}): UseMobileKeyboardReturn => {
  const [keyboard, setKeyboard] = useState({ height: 0, inset: 0 })
  const rafIdRef = useRef<number | null>(null)
  const bodyInputBlurredAtRef = useRef(-Infinity)

  // 1. Keyboard height → CSS variables + state. A keyboard shows up in one of two ways:
  //    Safari keeps the layout viewport and shrinks the visual one (inset = innerHeight − vv.height);
  //    Chrome for iOS and Android shrink the layout viewport itself (shrink = closed innerHeight − innerHeight).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    const root = document.documentElement
    let closedInnerHeight = window.innerHeight

    const update = () => {
      // with no keyboard input focused the current height is the closed one (toolbars, rotation)
      if (!isKeyboardTextInput(document.activeElement)) closedInnerHeight = window.innerHeight
      const inset = vv ? Math.max(0, Math.round(window.innerHeight - vv.height)) : 0
      const shrink = Math.max(0, Math.round(closedInnerHeight - window.innerHeight))
      const measured = Math.max(inset, shrink)
      const height = measured >= keyboardThreshold ? measured : 0
      const coveredInset = height > 0 ? inset : 0
      root.style.setProperty(KEYBOARD_HEIGHT_CSS_VAR, `${height}px`)
      root.style.setProperty(KEYBOARD_INSET_CSS_VAR, `${coveredInset}px`)
      setKeyboard((prev) => (prev.height === height && prev.inset === coveredInset ? prev : { height, inset: coveredInset }))
    }

    vv?.addEventListener('resize', update)
    window.addEventListener('resize', update)
    update()
    return () => {
      vv?.removeEventListener('resize', update)
      window.removeEventListener('resize', update)
      root.style.removeProperty(KEYBOARD_HEIGHT_CSS_VAR)
      root.style.removeProperty(KEYBOARD_INSET_CSS_VAR)
    }
  }, [keyboardThreshold])

  // 2. Keep a body input where it is. A column-reverse body is bottom-anchored, which is right while
  //    the floating bar has the focus (a chat keeps the newest message in view) but wrong while a
  //    body input has it: the input must not move. So the input's screen position is remembered on
  //    focus (and whenever the user scrolls), and whenever the body's box changes — our padding on
  //    Safari, the layout viewport on Chrome/Android, the floating bar collapsing — the scroll offset
  //    is shifted so the input is back where it was. Positions are compared, not sizes, because the
  //    browser may already have clamped the offset when the box grew. ResizeObserver callbacks run
  //    after layout and before paint, so nothing flashes.
  useEffect(() => {
    const body = bodyRef?.current
    if (!body || typeof ResizeObserver === 'undefined' || keptBodies.has(body)) return
    keptBodies.add(body)
    let anchor: { el: HTMLElement; top: number } | null = null
    let lastHeight = body.clientHeight
    const remember = () => {
      if (anchor) anchor.top = anchor.el.getBoundingClientRect().top
    }
    const handleFocusIn = (e: FocusEvent) => {
      if (!isFocusedBodyInput(body, e.target)) return
      anchor = { el: e.target as HTMLElement, top: 0 }
      remember()
    }
    // A scroll event that arrives after the box changed but before the observer ran is the browser
    // clamping the offset to the new range, not the user scrolling: the remembered position survives it.
    const handleScroll = () => {
      if (body.clientHeight === lastHeight) remember()
    }
    const observer = new ResizeObserver(() => {
      const height = body.clientHeight
      const changed = height !== lastHeight
      const shrank = height < lastHeight
      lastHeight = height
      if (!changed || !anchor || !isBottomAnchored(body)) return
      const focused = document.activeElement === anchor.el
      const justBlurred = performance.now() - bodyInputBlurredAtRef.current < BLUR_GRACE_MS
      if (!focused && !justBlurred) return
      const top = anchor.el.getBoundingClientRect().top
      // in a column-reverse box a smaller scrollTop moves the content down
      body.scrollTop -= anchor.top - top
      // the box got shorter: reveal the input if the keyboard now hides it (a no-op when visible)
      if (shrank && focused) anchor.el.scrollIntoView?.({ block: 'nearest' })
      remember()
    })
    body.addEventListener('focusin', handleFocusIn)
    body.addEventListener('scroll', handleScroll, { passive: true })
    observer.observe(body)
    return () => {
      observer.disconnect()
      body.removeEventListener('focusin', handleFocusIn)
      body.removeEventListener('scroll', handleScroll)
      keptBodies.delete(body)
    }
  }, [bodyRef])

  // 4. Fallback lock: undo any window pan the browser still performs while the keyboard animates
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

  // Blur of a keyboard input: the keyboard leaves and some browsers pan the window while it does,
  // so the lock runs once more; a body input's blur also opens the grace window for 2.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleFocusOut = (e: FocusEvent) => {
      if (!isKeyboardTextInput(e.target)) return
      if (isFocusedBodyInput(bodyRef?.current, e.target)) bodyInputBlurredAtRef.current = performance.now()
      lockWindowTop()
    }
    window.addEventListener('focusout', handleFocusOut)
    return () => {
      window.removeEventListener('focusout', handleFocusOut)
      cancelLock()
    }
  }, [bodyRef, cancelLock, lockWindowTop])

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

  // 3. Tap interception — focus text inputs ourselves, without the scroll iOS would add.
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
      el.scrollTo({ top: isBottomAnchored(el) ? 0 : Math.max(0, el.scrollHeight - el.clientHeight), behavior })
    },
    [bodyRef],
  )

  return {
    containerStyle: { paddingBottom: `${keyboard.inset}px`, boxSizing: 'border-box' },
    isKeyboardOpen: keyboard.height > 0,
    floatingProps: { onPointerDown: handleFloatingPointerDown },
    bodyProps: { onPointerDown: handleBodyPointerDown },
    scrollToBottom,
  }
}
