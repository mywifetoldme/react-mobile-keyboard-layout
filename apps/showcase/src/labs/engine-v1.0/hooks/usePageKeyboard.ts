'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { isKeyboardTextInput } from '../utils/isKeyboardTextInput'

/**
 * usePageKeyboard -- PageLayout's own keyboard hook.
 *
 * PageLayout shares no strategy code with SubpageLayout (EXP-04-A): the two are separate
 * experiments and stay separately readable, so the measurement and the reading-position hold live
 * here even though they read the same way as useMobileKeyboard's. What this hook deliberately does
 * not have: a tap handler (PageLayout's tap builds the shell first, then focuses), and a rAF
 * top-lock (the document here is kept at the reader's offset by PageLayout's guard, on the event).
 *
 *  1. publish the keyboard height (`--rmkl-v10-kb`) and the covered inset (`--rmkl-v10-kb-inset`)
 *  2. keep a focused body input where it is while the body changes size, and hold the bottom edge
 *     while the composer has the focus
 */

/** CSS custom property with the keyboard height in px (`0px` while closed), in every browser. */
export const PAGE_KEYBOARD_HEIGHT_CSS_VAR = '--rmkl-v10-kb'
/** CSS custom property with the part of the layout viewport the keyboard covers (Safari); `0px` where the layout viewport itself shrinks. */
export const PAGE_KEYBOARD_INSET_CSS_VAR = '--rmkl-v10-kb-inset'

export interface UsePageKeyboardOptions {
  /** The column-reverse body PageLayout renders (its `bodyRef`) */
  bodyRef?: RefObject<HTMLElement | null>
  /**
   * Below this many pixels a viewport contraction is not a keyboard. Default: 100.
   * The one number here that is not from a specification: Safari has no VirtualKeyboard API, so the
   * keyboard is inferred from geometry, and the frames of a URL-bar transition contract the visual
   * viewport by up to ~40px (iOS 18, measured) while a keyboard is 250px or more. Anything between
   * those two behaves the same -- the value is a floor over the noise, not a property of the keyboard.
   */
  keyboardThreshold?: number
}

export interface UsePageKeyboardReturn {
  isKeyboardOpen: boolean
  keyboardHeight: number
  keyboardInset: number
  /** Scroll the body to its end (scrollTop 0 in a column-reverse body) */
  scrollToBottom: (behavior?: ScrollBehavior) => void
}

const isBottomAnchored = (el: HTMLElement) => getComputedStyle(el).flexDirection === 'column-reverse'

/** Bodies already kept still by an instance -- a second instance on the same body (PageLayout's own next to the caller's) must not correct twice. */
const keptBodies = new WeakSet<HTMLElement>()

const isFocusedBodyInput = (body: HTMLElement | null | undefined, el: EventTarget | Element | null) =>
  !!body && el instanceof Node && body.contains(el) && isKeyboardTextInput(el)

export const usePageKeyboard = ({ bodyRef, keyboardThreshold = 100 }: UsePageKeyboardOptions = {}): UsePageKeyboardReturn => {
  const [keyboard, setKeyboard] = useState({ height: 0, inset: 0 })
  // a body input has blurred and no keyboard input has taken the focus since: its close is still ours to hold
  const bodyInputClosingRef = useRef(false)

  // 1. Keyboard geometry -> CSS variables + state. Safari keeps the layout viewport and shrinks the
  //    visual one (inset = innerHeight - vv.height); Chrome for iOS and Android shrink the layout
  //    viewport itself (shrink = closed innerHeight - innerHeight).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    const root = document.documentElement
    let closedInnerHeight = window.innerHeight
    let published = { height: -1, inset: -1 }

    const update = () => {
      // with no keyboard input focused the current height is the closed one (toolbars, rotation)
      if (!isKeyboardTextInput(document.activeElement)) closedInnerHeight = window.innerHeight
      // vv.height is in zoomed CSS pixels; times the scale it is the visible height in layout
      // pixels, the unit innerHeight is in. Without the scale a 2x zoom alone read as a 348px keyboard.
      const inset = vv ? Math.max(0, Math.round(window.innerHeight - vv.height * (vv.scale || 1))) : 0
      const shrink = Math.max(0, Math.round(closedInnerHeight - window.innerHeight))
      const measured = Math.max(inset, shrink)
      const height = measured >= keyboardThreshold ? measured : 0
      const coveredInset = height > 0 ? inset : 0
      if (published.height === height && published.inset === coveredInset) return
      published = { height, inset: coveredInset }
      root.style.setProperty(PAGE_KEYBOARD_HEIGHT_CSS_VAR, `${height}px`)
      root.style.setProperty(PAGE_KEYBOARD_INSET_CSS_VAR, `${coveredInset}px`)
      setKeyboard((prev) => (prev.height === height && prev.inset === coveredInset ? prev : { height, inset: coveredInset }))
    }

    // Measured on scroll as well: iOS Safari shrinks innerHeight as the keyboard opens and restores
    // it later without a resize event -- only scroll events mark the restoration (measured on
    // device: innerHeight 400 -> 735, inset left at 8px until the next resize). Writes only on change.
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
      root.style.removeProperty(PAGE_KEYBOARD_HEIGHT_CSS_VAR)
      root.style.removeProperty(PAGE_KEYBOARD_INSET_CSS_VAR)
    }
  }, [keyboardThreshold])

  // 2. Keep the reading position when the body's box changes (our padding on Safari, the layout
  //    viewport on Chrome/Android, the composer collapsing). Two cases:
  //    - the composer has the focus: the bottom edge holds. A column-reverse body only does that by
  //      itself at scrollTop 0; scrolled up, WebKit keeps the top-based offset and the newest content
  //      slides behind the keyboard (measured on iPhone). So the offset from before the change is put back.
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
    const composerHasFocus = () => {
      const active = document.activeElement
      return isKeyboardTextInput(active) && !body.contains(active)
    }
    const handleFocusIn = (e: FocusEvent) => {
      if (!isFocusedBodyInput(body, e.target)) return
      anchor = { el: e.target as HTMLElement, top: 0 }
      remember()
    }
    // The composer's focusin does not pass through the body. The offset at that moment is the one to
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
      // The anchor outlives its input's blur (its close needs it), so "no anchor" is not the test
      // for the composer's turn -- "the anchored input is neither focused nor closing" is. Closing
      // lasts from the blur until the next keyboard input takes the focus: an event, not a timer.
      // Once the composer has the focus, the turn is the composer's.
      const focused = !!anchor && document.activeElement === anchor.el
      const closing = !!anchor && !composerHasFocus() && bodyInputClosingRef.current
      if (!anchor || (!focused && !closing)) {
        // the composer's turn: hold the bottom edge by putting back the offset from before the change
        if (composerHasFocus()) body.scrollTop = lastScrollTop
        lastScrollTop = body.scrollTop
        return
      }
      const top = anchor.el.getBoundingClientRect().top
      // in a column-reverse box a smaller scrollTop moves the content down
      body.scrollTop -= anchor.top - top
      // the box got shorter: reveal the input if the keyboard now hides it (a no-op when visible).
      // The body alone is scrolled -- scrollIntoView would also scroll any ancestor, including the
      // frozen document, and take the header with it. Smoothly: the keyboard itself animates in.
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

  // A body input's blur marks its close as ours to hold (2), until the next keyboard input takes the focus.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleFocusOut = (e: FocusEvent) => {
      if (isFocusedBodyInput(bodyRef?.current, e.target)) bodyInputClosingRef.current = true
    }
    const handleFocusIn = (e: FocusEvent) => {
      if (isKeyboardTextInput(e.target)) bodyInputClosingRef.current = false
    }
    window.addEventListener('focusout', handleFocusOut)
    window.addEventListener('focusin', handleFocusIn)
    return () => {
      window.removeEventListener('focusout', handleFocusOut)
      window.removeEventListener('focusin', handleFocusIn)
    }
  }, [bodyRef])

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const el = bodyRef?.current
      if (!el) return
      el.scrollTo({ top: isBottomAnchored(el) ? 0 : Math.max(0, el.scrollHeight - el.clientHeight), behavior })
    },
    [bodyRef],
  )

  return { isKeyboardOpen: keyboard.height > 0, keyboardHeight: keyboard.height, keyboardInset: keyboard.inset, scrollToBottom }
}
