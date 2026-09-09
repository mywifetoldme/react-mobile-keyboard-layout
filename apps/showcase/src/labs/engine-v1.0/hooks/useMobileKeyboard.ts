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
export const KEYBOARD_HEIGHT_CSS_VAR = '--rmkl-v10-kb'
/**
 * CSS custom property with the part of the layout viewport the keyboard covers. Safari keeps the
 * layout viewport and shrinks the visual one, so this equals the keyboard height; browsers that
 * resize the layout viewport itself (Chrome for iOS, Android) report `0px` — nothing is covered.
 */
export const KEYBOARD_INSET_CSS_VAR = '--rmkl-v10-kb-inset'

export interface UseMobileKeyboardOptions {
  /** Ref to the scrollable content container */
  bodyRef?: RefObject<HTMLElement | null>
  /** Threshold in pixels to treat viewport height contraction as keyboard opening. Default: 100 */
  keyboardThreshold?: number
  /**
   * Duration in milliseconds of the fallback rAF top-lock loop started on tap and on blur. Default: 350.
   * `0` turns the lock off entirely -- for a layout that keeps the window at a non-zero offset on purpose.
   */
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
 *  1. publish the keyboard height (`--rmkl-v10-kb`) and the covered inset (`--rmkl-v10-kb-inset`) as CSS variables
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

  // 2. Keep the reading position when the body's box changes — our padding on Safari, the layout
  //    viewport on Chrome/Android, the floating bar collapsing. Two cases:
  //    - the floating bar has the focus: a chat keeps the newest message in view, i.e. the bottom
  //      edge holds. A column-reverse body only does that by itself at scrollTop 0; scrolled up,
  //      WebKit keeps the top-based offset and the newest content slides behind the keyboard
  //      (measured on iPhone). So the offset from before the change is put back.
  //    - a body input has the focus: the input must not move. Its screen position is remembered on
  //      focus (and whenever the user scrolls) and the offset is shifted so it is back where it was.
  //      Positions are compared, not sizes, because the browser may already have clamped the offset.
  //    ResizeObserver callbacks run after layout and before paint, so nothing flashes.
  useEffect(() => {
    const body = bodyRef?.current
    if (!body || typeof ResizeObserver === 'undefined' || keptBodies.has(body)) return
    keptBodies.add(body)
    let anchor: { el: HTMLElement; top: number } | null = null
    let lastHeight = body.clientHeight
    let lastScrollTop = body.scrollTop
    const remember = () => {
      if (anchor) anchor.top = anchor.el.getBoundingClientRect().top
      lastScrollTop = body.scrollTop
    }
    const floatingHasFocus = () => {
      const active = document.activeElement
      return isKeyboardTextInput(active) && !body.contains(active)
    }
    const handleFocusIn = (e: FocusEvent) => {
      if (!isFocusedBodyInput(body, e.target)) return
      anchor = { el: e.target as HTMLElement, top: 0 }
      remember()
    }
    // The bar's focusin does not pass through the body. The offset at that moment is the one to
    // hold: a caller may have just moved the body (before any scroll event is delivered), and the
    // scroll handler below ignores events that arrive while the box is changing.
    const handleWindowFocusIn = (e: FocusEvent) => {
      if (isKeyboardTextInput(e.target) && !body.contains(e.target as Node)) lastScrollTop = body.scrollTop
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
      if (!changed || !isBottomAnchored(body)) return
      // The anchor outlives its input's blur (the grace window needs it), so "no anchor" is not
      // the test for the bar's turn -- "the anchored input is neither focused nor just blurred" is.
      // And the grace window is for that input's own close: once the bar has the focus, the turn
      // is the bar's, or the anchor would rewind the shell to where the body input had been.
      const focused = !!anchor && document.activeElement === anchor.el
      const justBlurred = !!anchor && !floatingHasFocus() && performance.now() - bodyInputBlurredAtRef.current < BLUR_GRACE_MS
      if (!anchor || (!focused && !justBlurred)) {
        // the bar's turn: hold the bottom edge by putting back the offset from before the change
        if (floatingHasFocus()) body.scrollTop = lastScrollTop
        lastScrollTop = body.scrollTop
        return
      }
      const top = anchor.el.getBoundingClientRect().top
      // in a column-reverse box a smaller scrollTop moves the content down
      body.scrollTop -= anchor.top - top
      // the box got shorter: reveal the input if the keyboard now hides it (a no-op when visible).
      // The body alone is scrolled -- scrollIntoView would also scroll any ancestor, including a
      // document that a layout has frozen, and take the header with it. Smoothly: the keyboard
      // itself animates in, and an instant jump under a finger that just tapped reads as a bounce.
      if (shrank && focused) {
        const box = body.getBoundingClientRect()
        const rect = anchor.el.getBoundingClientRect()
        const below = rect.bottom - box.bottom
        const above = box.top - rect.top
        if (below > 0) body.scrollBy?.({ top: below, behavior: 'smooth' })
        else if (above > 0) body.scrollBy?.({ top: -above, behavior: 'smooth' })
      }
      remember()
    })
    body.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusin', handleWindowFocusIn)
    body.addEventListener('scroll', handleScroll, { passive: true })
    observer.observe(body)
    return () => {
      observer.disconnect()
      body.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusin', handleWindowFocusIn)
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
    if (typeof window === 'undefined' || lockDurationMs <= 0) return
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
