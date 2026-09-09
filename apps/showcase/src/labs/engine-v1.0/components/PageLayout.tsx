'use client'

import {
  forwardRef,
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

/**
 * The document's height while the shell is up: the reader's offset plus one viewport, published
 * while the document scrolls. Read by PageLayout.css.
 */
export const PAGE_LOCK_Y_CSS_VAR = '--rmkl-v10-page-lock-y'

const INPUT_SELECTOR = 'input, textarea, [contenteditable]'
/** How long after the pointerup focus the tap's own click may still arrive (~400ms measured worst case on iOS). */
const TAP_CLICK_WINDOW_MS = 600

const keyboardInputOf = (target: EventTarget | null): HTMLElement | null => {
  const el = target instanceof Element ? target.closest(INPUT_SELECTOR) : null
  return isKeyboardTextInput(el) ? (el as HTMLElement) : null
}
const focusedInputInside = (root: HTMLElement): HTMLElement | null => {
  const active = document.activeElement
  return active instanceof HTMLElement && root.contains(active) && isKeyboardTextInput(active) ? active : null
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
 * mousedown synthesized at the original point would blur the input. While that click is pending, a
 * mousedown anywhere but the focused input is refused.
 */
const useTapToFocus = (rootRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let armed: HTMLElement | null = null
    let clickPendingUntil = 0

    const onPointerDown = (e: Event) => {
      armed = keyboardInputOf(e.target)
    }
    const onPointerCancel = () => {
      armed = null
    }
    const onPointerUp = (e: Event) => {
      const input = keyboardInputOf(e.target)
      if (!input || input !== armed) return
      armed = null
      clickPendingUntil = performance.now() + TAP_CLICK_WINDOW_MS
      input.focus({ preventScroll: true })
    }
    const onClick = () => {
      clickPendingUntil = 0
    }
    const onMouseDown = (e: MouseEvent) => {
      if (performance.now() >= clickPendingUntil) return
      const focused = focusedInputInside(root)
      if (focused && e.target !== focused) e.preventDefault()
    }

    root.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
    root.addEventListener('pointercancel', onPointerCancel, { capture: true, passive: true })
    root.addEventListener('pointerup', onPointerUp, { capture: true, passive: true })
    root.addEventListener('mousedown', onMouseDown, { capture: true })
    root.addEventListener('click', onClick, { capture: true })
    return () => {
      root.removeEventListener('pointerdown', onPointerDown, { capture: true })
      root.removeEventListener('pointercancel', onPointerCancel, { capture: true })
      root.removeEventListener('pointerup', onPointerUp, { capture: true })
      root.removeEventListener('mousedown', onMouseDown, { capture: true })
      root.removeEventListener('click', onClick, { capture: true })
    }
  }, [rootRef])
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
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof window === 'undefined') return
    // only the offset: the viewport half of the cap is CSS's 100%, which follows Safari's resizes
    let lockY = 0
    const publishOffset = () => {
      lockY = Math.round(window.scrollY)
      document.documentElement.style.setProperty(PAGE_LOCK_Y_CSS_VAR, `${lockY}px`)
    }
    // The cap declares the document frozen; iOS Safari's caret reveal does not ask -- it pans
    // the window past the document's own maximum (measured offset + 94, + 299) and the fixed
    // shell rides up with it. So the declaration is enforced: while the shell is up, the
    // offset is the published one. (EXP-04-A's engine does the same at 0 on a timer.)
    const onScroll = () => {
      if (!focusedInputInside(root)) publishOffset()
      else if (Math.round(window.scrollY) !== lockY) window.scrollTo(0, lockY)
    }
    // The same pan without the window moving: the visual viewport slides over the layout
    // viewport (measured 40px after the URL bar was pulled open). Asking for the offset we
    // already have is how the layout viewport is put back under it.
    const onViewportScroll = () => {
      if (focusedInputInside(root) && window.visualViewport && window.visualViewport.offsetTop !== 0) window.scrollTo(0, lockY)
    }
    const onFocusIn = (e: FocusEvent) => {
      if (!isKeyboardTextInput(e.target)) return
      const from = e.relatedTarget
      if (from instanceof Node && root.contains(from) && isKeyboardTextInput(from)) return
      publishOffset()
      const main = bodyRef.current
      if (!main) return
      // column-reverse: 0 is the end of the content; the document's offset from the top is that far short of it
      main.scrollTop = Math.round(window.scrollY) - (main.scrollHeight - main.clientHeight)
    }

    publishOffset()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.visualViewport?.addEventListener('scroll', onViewportScroll)
    root.addEventListener('focusin', onFocusIn, { capture: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.visualViewport?.removeEventListener('scroll', onViewportScroll)
      root.removeEventListener('focusin', onFocusIn, { capture: true })
      document.documentElement.style.removeProperty(PAGE_LOCK_Y_CSS_VAR)
    }
  }, [rootRef, bodyRef])
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
  // The hook publishes --rmkl-v10-kb / --rmkl-v10-kb-inset and keeps the reading position in the
  // column-reverse body. Its bodyProps/floatingProps are not wired and its top-lock is off: both
  // scroll the window to 0, and here the window has to stay where the reader left it.
  const internalEngine = useMobileKeyboard({ bodyRef: resolvedBodyRef, lockDurationMs: 0 })
  void (keyboardEngine ?? internalEngine)
  useTapToFocus(rootRef)
  useDocumentHandoff(rootRef, resolvedBodyRef)

  const setRoot = (el: HTMLDivElement | null) => {
    rootRef.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  return (
    <div ref={setRoot} className={`rmkl-v10-page-root ${className}`.trim()} style={style} {...rest}>
      {header ? (
        <div className="rmkl-v10-page-header-slot">{header}</div>
      ) : (
        <header role="banner" {...headerProps} className={`rmkl-v10-page-header ${headerProps?.className ?? ''}`.trim()}>
          <div className="rmkl-v10-header-left">{headerLeft}</div>
          <h1 className="rmkl-v10-header-title">{title}</h1>
          <div className="rmkl-v10-header-right">{headerRight}</div>
        </header>
      )}

      <div className="rmkl-v10-page-body-container">
        <main role="main" ref={resolvedBodyRef} {...bodyProps} className={`rmkl-v10-page-body ${bodyProps?.className ?? ''}`.trim()}>
          <div className="rmkl-v10-page-body-inner">{children}</div>
        </main>

        {footer && (
          <footer role="contentinfo" {...footerProps} className={`rmkl-v10-page-footer ${footerProps?.className ?? ''}`.trim()}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
})

PageLayout.displayName = 'PageLayout'
