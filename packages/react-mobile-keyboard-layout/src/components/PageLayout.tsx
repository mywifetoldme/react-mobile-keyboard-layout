'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type HTMLAttributes,
  type ComponentPropsWithoutRef,
  type RefObject,
} from 'react'
import { useMobileKeyboard, type UseMobileKeyboardReturn } from '../hooks/useMobileKeyboard'
import { isKeyboardTextInput } from '../utils/isKeyboardTextInput'
import './PageLayout.css'

/*
 * Every number JavaScript derives for this layout, where it is read from, what refreshes it and
 * what it is written to. A code path that is not in this table is a bug waiting for the event
 * iOS does not send -- each row below was, at some point, a device report.
 *
 *   value                       read from                    refreshed on                          written to
 *   --rmkl-page-lock-y          window.scrollY               scroll (idle); focusin (capture)      the CSS cap: calc(y + 100lvh)
 *   main.scrollTop (hand-off)   scrollY, main scroll range   focusin (capture), once               the shell's scroller
 *   window offset (the guard)   scrollY vs lock-y            scroll (locked); vv scroll (nudge<=2) window.scrollTo -- the one write-back
 *   --rmkl-kb / --rmkl-kb-inset innerHeight, vv.height       vv resize, resize, scroll, vv scroll  shell padding, composer bottom  (useMobileKeyboard)
 *   body-input anchor / edge    input rect, main.scrollTop   ResizeObserver(main); focusin (bubble) main.scrollTop                 (useMobileKeyboard)
 *
 * Order that the code relies on: the hand-off runs in the capture phase so the hook's anchor
 * (bubble) sees the post-transfer position; the guard is driven by the scroll Safari's pan
 * emits, so it cannot run early; the inset is re-measured on any viewport signal, so nothing
 * waits for iOS to send a resize.
 */

/**
 * The document's height while the shell is up: the reader's offset plus one viewport, published
 * while the document scrolls. Read by PageLayout.css.
 */
export const PAGE_LOCK_Y_CSS_VAR = '--rmkl-page-lock-y'

const INPUT_SELECTOR = 'input, textarea, [contenteditable]'
/** On the root while the shell is up. Set by the tap before it focuses, so the shell exists when Safari looks. */
export const PAGE_SHELL_ATTR = 'data-rmkl-shell'

const keyboardInputOf = (target: EventTarget | null): HTMLElement | null => {
  const el = target instanceof Element ? target.closest(INPUT_SELECTOR) : null
  return isKeyboardTextInput(el) ? (el as HTMLElement) : null
}

/**
 * The TAP opens the shell, not the touch.
 *
 * pointerdown only arms the input under the finger; pointerup on that same input focuses it.
 * Focusing at pointerdown swapped the layout in the middle of a gesture — a finger that touched an
 * input and dragged then scrolled the frozen document and the shell's <main> at once. iOS cancels
 * the pointer when a drag begins, so a scroll never locks. Focusing at pointerup also puts the
 * focus ~50ms ahead of iOS's own (at click), so the keyboard's resize mostly lands after the click.
 *
 * The tap's own click still has to land. If the keyboard inset moved the content in between, the
 * mousedown synthesized at the original point would blur the input. While that click is pending,
 * every mousedown is refused. "Pending" is bounded by events, not a clock: the click itself, a
 * cancelled pointer, or the next pointerdown (a new gesture -- the previous tap's click, if it was
 * ever coming, has been delivered by then). A focus without a tap therefore cannot leave the
 * protection stuck open.
 */
const useTapToFocus = (rootRef: RefObject<HTMLElement | null>, enterShell: () => void) => {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let armed: HTMLElement | null = null
    let clickPending = false

    const onPointerDown = (e: Event) => {
      clickPending = false
      armed = keyboardInputOf(e.target)
    }
    const onPointerCancel = () => {
      armed = null
      clickPending = false
    }
    const onPointerUp = (e: Event) => {
      const input = keyboardInputOf(e.target)
      if (!input || input !== armed) return
      armed = null
      clickPending = true
      // the shell first, then the focus: Safari must find the input inside our scroller
      enterShell()
      input.focus({ preventScroll: true })
      if (document.activeElement !== input) root.removeAttribute(PAGE_SHELL_ATTR)
    }
    const onFocusIn = (e: FocusEvent) => {
      if (keyboardInputOf(e.target)) clickPending = true
    }
    const onClick = (e: MouseEvent) => {
      if (!clickPending) return
      e.preventDefault()
      clickPending = false
    }
    const onMouseDown = (e: MouseEvent) => {
      if (clickPending) e.preventDefault()
    }

    root.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
    root.addEventListener('pointercancel', onPointerCancel, { capture: true, passive: true })
    root.addEventListener('pointerup', onPointerUp, { capture: true, passive: true })
    root.addEventListener('focusin', onFocusIn, { capture: true })
    root.addEventListener('mousedown', onMouseDown, { capture: true })
    root.addEventListener('click', onClick, { capture: true })
    return () => {
      root.removeEventListener('pointerdown', onPointerDown, { capture: true })
      root.removeEventListener('pointercancel', onPointerCancel, { capture: true })
      root.removeEventListener('pointerup', onPointerUp, { capture: true })
      root.removeEventListener('focusin', onFocusIn, { capture: true })
      root.removeEventListener('mousedown', onMouseDown, { capture: true })
      root.removeEventListener('click', onClick, { capture: true })
    }
  }, [rootRef, enterShell])
}

/**
 * The one job CSS cannot do: carry the reader's position from the document into the shell.
 *
 * While the document scrolls, its offset plus one viewport is published as a CSS variable, the way
 * the hook publishes the keyboard height. So when focus arrives the cap is already in place and the
 * flip to the shell leaves the document exactly where it was. On entry the cap is republished from
 * the live offset and that offset is handed to <main> once; focus moving between inputs inside the
 * shell is not a new entry. Nothing is written back on the way out: the document never moved.
 *
 * Capture phase on purpose: useMobileKeyboard listens for focusin on <main> to remember where a
 * focused body input sits; it has to see the input where the transfer leaves it.
 */
const useDocumentHandoff = (rootRef: RefObject<HTMLElement | null>, bodyRef: RefObject<HTMLElement | null>) => {
  // Enter the shell: publish the offset, flip the attribute, hand the offset to <main>. Idempotent,
  // so the tap (before focusing) and focusin (a focus that did not come from a tap) can both call it.
  const enterShell = useCallback(() => {
    const root = rootRef.current
    if (!root || root.hasAttribute(PAGE_SHELL_ATTR)) return
    const y = Math.round(window.scrollY)
    document.documentElement.style.setProperty(PAGE_LOCK_Y_CSS_VAR, `${y}px`)
    root.setAttribute(PAGE_SHELL_ATTR, '')
    const main = bodyRef.current
    if (!main) return
    // column-reverse: 0 is the end of the content; the document's offset from the top is that far
    // short of it. Reading scrollHeight lays the shell out, so the transfer lands in the shell.
    main.scrollTop = y - (main.scrollHeight - main.clientHeight)
  }, [rootRef, bodyRef])

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof window === 'undefined') return
    const inShell = () => root.hasAttribute(PAGE_SHELL_ATTR)
    // only the offset: the viewport half of the cap is CSS's 100lvh
    const lockY = () => Math.round(Number.parseFloat(document.documentElement.style.getPropertyValue(PAGE_LOCK_Y_CSS_VAR)) || 0)
    const publishOffset = () => {
      document.documentElement.style.setProperty(PAGE_LOCK_Y_CSS_VAR, `${Math.round(window.scrollY)}px`)
    }
    // The cap declares the document frozen; iOS Safari's caret reveal does not ask -- it pans
    // the window past the document's own maximum (measured offset + 94, + 299) and the fixed
    // shell rides up with it. So the declaration is enforced: while the shell is up, the
    // offset is the published one. (EXP-04-A's engine does the same at 0 on a timer.)
    const onScroll = () => {
      if (!inShell()) publishOffset()
      else if (Math.round(window.scrollY) !== lockY()) window.scrollTo(0, lockY())
    }
    // Safari's pan animates the visual viewport on past the layout viewport after the window
    // has been put back (measured offsetTop 127 with the window already at the offset). The two
    // re-sync on a real scroll: the window is asked to move 1px, and the guard above returns it.
    // Bounded, so a viewport that will not re-sync cannot keep it busy.
    // Small resting offsets (<= 10px, e.g. collapsed URL bar) are ignored so they don't nudge.
    let nudges = 0
    const onViewportScroll = () => {
      if (!inShell() || !window.visualViewport) return
      if (Math.abs(window.visualViewport.offsetTop) <= 10) return
      if (Math.round(window.scrollY) !== lockY() || nudges >= 2) return
      nudges += 1
      window.scrollTo(0, lockY() > 0 ? lockY() - 1 : lockY() + 1)
    }
    // a focus that did not come from the tap (programmatic, keyboard navigation) enters the shell here
    const onFocusIn = (e: FocusEvent) => {
      if (!isKeyboardTextInput(e.target)) return
      nudges = 0
      enterShell()
    }
    // the focus leaves the layout's keyboard inputs: the shell goes, the document is where it was
    const onFocusOut = (e: FocusEvent) => {
      if (!isKeyboardTextInput(e.target)) return
      const to = e.relatedTarget
      if (to instanceof Node && root.contains(to) && isKeyboardTextInput(to)) return
      root.removeAttribute(PAGE_SHELL_ATTR)
    }

    publishOffset()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.visualViewport?.addEventListener('scroll', onViewportScroll)
    root.addEventListener('focusin', onFocusIn, { capture: true })
    root.addEventListener('focusout', onFocusOut, { capture: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.visualViewport?.removeEventListener('scroll', onViewportScroll)
      root.removeEventListener('focusin', onFocusIn, { capture: true })
      root.removeEventListener('focusout', onFocusOut, { capture: true })
      root.removeAttribute(PAGE_SHELL_ATTR)
      document.documentElement.style.removeProperty(PAGE_LOCK_Y_CSS_VAR)
    }
  }, [rootRef, bodyRef, enterShell])
  return enterShell
}

export interface PageLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  headerLeft?: ReactNode
  headerRight?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  bodyRef?: RefObject<HTMLDivElement | null>
  /**
   * Share the caller's hook instance (e.g. to read isKeyboardOpen). Create it with
   * `lockDurationMs: 0`: the fallback top-lock scrolls the window to 0, and this layout keeps the
   * window where the reader left it.
   */
  keyboardEngine?: UseMobileKeyboardReturn
  headerProps?: ComponentPropsWithoutRef<'header'>
  bodyProps?: ComponentPropsWithoutRef<'main'>
  footerProps?: ComponentPropsWithoutRef<'footer'>
}

/**
 * A page whose document scrolls like any web page — so iOS Safari collapses its URL bar — until an
 * input is tapped. Then a fixed shell takes the screen with the header pinned and the footer on the
 * keyboard, at the same reading position, and hands the document back untouched when the keyboard
 * leaves. Which of the two you are in is decided by focus, in PageLayout.css.
 *
 * Use SubpageLayout when the page is the shell to begin with (a chat screen that never scrolls the
 * document); use PageLayout when the page is a document with a composer.
 */
export const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(({
  title,
  headerLeft,
  headerRight,
  header,
  footer,
  children,
  bodyRef,
  className = '',
  style,
  keyboardEngine,
  headerProps,
  bodyProps,
  footerProps,
  ...rest
}, ref) => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const ownBodyRef = useRef<HTMLDivElement | null>(null)
  const resolvedBodyRef = bodyRef ?? ownBodyRef
  // The hook publishes --rmkl-kb / --rmkl-kb-inset and keeps the reading position in the
  // column-reverse body. Its bodyProps/floatingProps are not wired and its top-lock is off: both
  // scroll the window to 0, and here the window has to stay where the reader left it.
  const internalEngine = useMobileKeyboard({ bodyRef: resolvedBodyRef, lockDurationMs: 0 })
  void (keyboardEngine ?? internalEngine)
  const enterShell = useDocumentHandoff(rootRef, resolvedBodyRef)
  useTapToFocus(rootRef, enterShell)

  const setRoot = (el: HTMLDivElement | null) => {
    rootRef.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  return (
    <div ref={setRoot} className={`rmkl-page-root ${className}`.trim()} style={style} {...rest}>
      {header ? (
        <div className="rmkl-page-header-slot">{header}</div>
      ) : (
        <header role="banner" {...headerProps} className={`rmkl-page-header ${headerProps?.className ?? ''}`.trim()}>
          <div className="rmkl-header-left">{headerLeft}</div>
          <h1 className="rmkl-header-title">{title}</h1>
          <div className="rmkl-header-right">{headerRight}</div>
        </header>
      )}

      <div className="rmkl-page-body-container">
        <main role="main" ref={resolvedBodyRef} {...bodyProps} className={`rmkl-page-body ${bodyProps?.className ?? ''}`.trim()}>
          <div className="rmkl-page-body-inner">{children}</div>
        </main>

        {footer && (
          <footer role="contentinfo" {...footerProps} className={`rmkl-page-footer ${footerProps?.className ?? ''}`.trim()}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
})

PageLayout.displayName = 'PageLayout'
