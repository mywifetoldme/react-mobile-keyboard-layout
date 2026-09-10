import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRef } from 'react'
import { render, act, cleanup, screen } from '@testing-library/react'
import { PageLayout, PAGE_LOCK_Y_CSS_VAR, type PageLayoutHandle } from './PageLayout'
import { FloatingInput } from './FloatingInput'
import css from './PageLayout.css?raw'

/**
 * PageLayout: the document scrolls until an input is tapped; then a shell takes the screen at the
 * same reading position. Which one is decided by focus, in CSS. The one JS job is carrying the
 * reader's position from the document into the shell's scroller. Every rule and behaviour here was
 * first measured on an iPhone in the EXP-04-B lab.
 */

const VIEWPORT_HEIGHT = 800
/** Both scroll spaces hold the same content, so they scroll the same distance. */
const MAX_SCROLL = 1000

let scrollToSpy: ReturnType<typeof vi.fn>

const installWindowScroll = () => {
  let y = 0
  Object.defineProperty(window, 'scrollY', { get: () => y, configurable: true })
  scrollToSpy = vi.fn()
  window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo
  return {
    set: (next: number) => {
      y = next
      window.dispatchEvent(new Event('scroll'))
    },
  }
}
let windowScroll: ReturnType<typeof installWindowScroll>

/** A column-reverse scroller: scrollTop is 0 at the bottom and negative toward the top, clamped like a browser. */
const installScroller = (el: HTMLElement) => {
  const scrollHeight = VIEWPORT_HEIGHT + MAX_SCROLL
  let scrollTop = 0
  const clamp = (v: number) => Math.min(0, Math.max(-(scrollHeight - VIEWPORT_HEIGHT), v))
  Object.defineProperty(el, 'scrollTop', { get: () => clamp(scrollTop), set: (v: number) => { scrollTop = clamp(v) }, configurable: true })
  Object.defineProperty(el, 'clientHeight', { get: () => VIEWPORT_HEIGHT, configurable: true })
  Object.defineProperty(el, 'scrollHeight', { get: () => scrollHeight, configurable: true })
}

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { value: VIEWPORT_HEIGHT, configurable: true, writable: true })
  windowScroll = installWindowScroll()
})
afterEach(() => {
  cleanup()
  document.documentElement.removeAttribute('style')
})

const renderPage = () => {
  render(
    <PageLayout title="Page" footer={<FloatingInput value="" onChange={() => {}} onSubmit={() => {}} placeholder="Write" />}>
      <label>
        Name <input type="text" placeholder="Body input" />
      </label>
      <label>
        Day <input type="date" defaultValue="2026-09-01" />
      </label>
      <p>content</p>
    </PageLayout>,
  )
  const main = document.querySelector('main.rmkl-page-body') as HTMLElement
  installScroller(main)
  return { main }
}

const ruleFor = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|\\n)[ \\t]*${escaped}[ \\t]*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
}
/** The declarations of a rule whose selector list contains `selector` (multi-selector rules). */
const ruleContaining = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`${escaped}[^{]*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
}

const tap = (el: HTMLElement) => {
  act(() => {
    el.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    el.dispatchEvent(new Event('pointerup', { bubbles: true }))
  })
}
const bodyInput = () => screen.getByPlaceholderText('Body input')
const composer = () => screen.getByPlaceholderText('Write')
const lockY = () => document.documentElement.style.getPropertyValue(PAGE_LOCK_Y_CSS_VAR)

const SHELL = '.rmkl-page-root[data-rmkl-shell]'

describe('PageLayout: the mode is decided by focus, in CSS', () => {
  it('hands the document to the browser while idle and pins header and footer in flow', () => {
    expect(ruleFor('html:has(.rmkl-page-root)')).toMatch(/overflow-y:\s*auto/)
    expect(ruleFor('body:has(.rmkl-page-root)')).toMatch(/overflow:\s*visible/)
    expect(ruleContaining('.rmkl-page-header-slot')).toMatch(/position:\s*sticky/)
    expect(ruleFor('.rmkl-page-footer')).toMatch(/position:\s*sticky/)
    expect(ruleFor('.rmkl-page-root')).toMatch(/touch-action:\s*manipulation/)
  })

  it('caps and freezes the document, never position: fixed, while a keyboard input has the focus', () => {
    const lock = ruleContaining(`body:has(${SHELL})`)
    // the cap is "offset + one full viewport", from CSS, not a number taken at focus time. It must
    // never clamp below the offset: 100% of html is iOS's small viewport (695 while innerHeight is
    // 735 with the URL bar collapsed) and shoved the document up 40px at focus; 100lvh is the large
    // one and is never less than innerHeight. The room it leaves (<= 40px, or what Safari shrinks
    // the viewport by) is the guard's business, not the cap's.
    expect(lock).toMatch(/height:\s*calc\(var\(--rmkl-page-lock-y, 0px\) \+ 100lvh\)/)
    expect(ruleContaining(`html:has(${SHELL})`)).not.toMatch(/height:\s*100%/)
    expect(lock).toMatch(/overflow:\s*hidden/)
    // fixing the body resets its offset and makes Safari re-expand its URL bar under the finger
    expect(lock).not.toMatch(/position:\s*fixed/)
    expect(ruleFor(SHELL)).toMatch(/position:\s*fixed/)
  })

  it('keys the shell to one attribute the tap sets before focusing -- never to :focus, which exists only after', () => {
    // Safari decides where to reveal a focused input when it is focused; with the shell keyed to
    // :focus the document was still the scroller at that moment and Safari panned it (9 of 48 opens)
    expect(css).not.toMatch(/:focus-within/)
    expect(css).not.toMatch(/\.rmkl-page-root:has\([^)]*:focus\)\s*[,{]/)
    expect(css).not.toMatch(/body:has\([^)]*:focus\)/)
    expect(css).toMatch(/\.rmkl-page-root\[data-rmkl-shell\]\s*\{/)
  })

  it('reserves the keyboard inset in the shell and keeps a drag on the composer from chaining into the document', () => {
    expect(ruleContaining(`${SHELL} .rmkl-page-body-container`)).toMatch(/padding-bottom:\s*var\(--rmkl-kb-inset/)
    expect(ruleContaining(`${SHELL} .rmkl-page-footer`)).toMatch(/touch-action:\s*none/)
    expect(ruleFor('.rmkl-page-footer textarea')).toMatch(/overscroll-behavior:\s*contain/)
  })

  it('keeps the shell body bottom-anchored so the hook can hold the reading position', () => {
    expect(ruleFor('.rmkl-page-body')).toMatch(/flex-direction:\s*column-reverse/)
  })
})

describe('PageLayout: the one JS job -- carry the position into the shell, once', () => {
  it('publishes the document offset while it scrolls, so the cap is in place before the flip', () => {
    renderPage()
    windowScroll.set(600)
    expect(lockY()).toBe('600px')
  })

  it('publishes nothing that depends on the viewport height -- Safari changes it under the lock', () => {
    renderPage()
    windowScroll.set(600)
    tap(bodyInput())
    Object.defineProperty(window, 'innerHeight', { value: VIEWPORT_HEIGHT - 299, configurable: true, writable: true })
    window.dispatchEvent(new Event('resize'))
    expect(lockY()).toBe('600px')
  })

  it('builds the shell before the focus: at focus time the attribute is set and the offset already handed over', () => {
    const { main } = renderPage()
    windowScroll.set(600)
    let atFocus: { shell: boolean; scrollTop: number } | null = null
    bodyInput().addEventListener('focus', () => {
      atFocus = { shell: (document.querySelector('.rmkl-page-root') as HTMLElement).hasAttribute('data-rmkl-shell'), scrollTop: main.scrollTop }
    })
    tap(bodyInput())
    expect(document.activeElement).toBe(bodyInput())
    expect(atFocus).toEqual({ shell: true, scrollTop: 600 - MAX_SCROLL })
  })

  it('opens the shell for a focus that did not come from a tap, and closes it when the focus leaves', () => {
    renderPage()
    const root = document.querySelector('.rmkl-page-root') as HTMLElement
    act(() => {
      bodyInput().focus()
    })
    expect(root.hasAttribute('data-rmkl-shell')).toBe(true)
    act(() => {
      composer().focus() // focus moving between inputs inside: still the shell
    })
    expect(root.hasAttribute('data-rmkl-shell')).toBe(true)
    act(() => {
      ;(document.activeElement as HTMLElement).blur()
    })
    expect(root.hasAttribute('data-rmkl-shell')).toBe(false)
  })

  it('does not open the shell for a native picker', () => {
    renderPage()
    const root = document.querySelector('.rmkl-page-root') as HTMLElement
    tap(document.querySelector('input[type="date"]') as HTMLElement)
    act(() => {
      ;(document.querySelector('input[type="date"]') as HTMLElement).focus()
    })
    expect(root.hasAttribute('data-rmkl-shell')).toBe(false)
  })

  it('transfers the reading position into the column-reverse scroller on entry', () => {
    const { main } = renderPage()
    windowScroll.set(600)
    tap(composer())
    // 0 is the bottom in column-reverse; the document's 600 from the top is 400 short of it
    expect(main.scrollTop).toBe(600 - MAX_SCROLL)
  })

  it('never moves the document itself -- not on entry, not on exit', () => {
    renderPage()
    windowScroll.set(600)
    tap(composer())
    act(() => {
      ;(document.activeElement as HTMLElement).blur()
    })
    expect(scrollToSpy).not.toHaveBeenCalled()
    expect(window.scrollY).toBe(600)
  })

  it('puts the document back if the browser pans it while it is frozen', () => {
    // iOS Safari's caret reveal scrolls past the document's own maximum (measured y = offset + 94,
    // + 299) and takes the fixed shell with it; the cap cannot stop it, so the declaration is
    // enforced: while a keyboard input inside holds the focus, the offset is the published one
    renderPage()
    windowScroll.set(600)
    tap(bodyInput())
    windowScroll.set(899)
    expect(scrollToSpy).toHaveBeenCalledWith(0, 600)
  })

  it('does not touch the window for a visual-viewport offset -- there is no pan left to undo', () => {
    // with the shell built before the focus Safari no longer pans the document (47 opens, 0 pans);
    // the 1px nudge that re-synced the visual viewport after a pan is gone with the pan
    const vv = Object.assign(new EventTarget(), { offsetTop: 0 })
    Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true, writable: true })
    renderPage()
    windowScroll.set(600)
    tap(bodyInput())
    vv.offsetTop = 127
    act(() => { vv.dispatchEvent(new Event('scroll')) })
    expect(scrollToSpy).not.toHaveBeenCalled()
    Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true, writable: true })
  })

  it('leaves the reader\'s own scrolling alone while idle and after the shell closes', () => {
    renderPage()
    windowScroll.set(600)
    windowScroll.set(700)
    tap(bodyInput())
    act(() => {
      ;(document.activeElement as HTMLElement).blur()
    })
    windowScroll.set(150)
    expect(scrollToSpy).not.toHaveBeenCalled()
    expect(lockY()).toBe('150px')
  })

  it('does not re-enter when focus moves between inputs inside the shell', () => {
    const { main } = renderPage()
    windowScroll.set(600)
    tap(composer())
    const offset = main.scrollTop
    act(() => {
      main.scrollTop = offset + 50
    })
    tap(bodyInput())
    expect(main.scrollTop).toBe(offset + 50)
  })

  it('transfers before bubble-phase focusin listeners on the body run (the hook remembers where a body input sits)', () => {
    const { main } = renderPage()
    windowScroll.set(600)
    let seen: number | null = null
    main.addEventListener('focusin', () => {
      seen = main.scrollTop
    })
    tap(bodyInput())
    expect(seen).toBe(600 - MAX_SCROLL)
  })
})

describe('PageLayout: the whole API a page needs -- a footer that knows the keyboard, a handle that scrolls', () => {
  it('passes the keyboard state to a footer given as a function', () => {
    let seen: { isKeyboardOpen: boolean; keyboardHeight: number; keyboardInset: number } | null = null
    render(
      <PageLayout
        title="Page"
        footer={(kb) => {
          seen = kb
          return <FloatingInput value="" onChange={() => {}} onSubmit={() => {}} placeholder="Write" isKeyboardOpen={kb.isKeyboardOpen} />
        }}
      >
        <p>content</p>
      </PageLayout>,
    )
    expect(seen).toEqual({ isKeyboardOpen: false, keyboardHeight: 0, keyboardInset: 0 })
    expect(screen.getByPlaceholderText('Write')).toBeTruthy()
  })

  it('exposes scrollToBottom on its ref: the document while idle, the shell scroller while the shell is up', () => {
    const handle = createRef<PageLayoutHandle>()
    render(
      <PageLayout ref={handle} title="Page" footer={<FloatingInput value="" onChange={() => {}} onSubmit={() => {}} placeholder="Write" />}>
        <label>
          Name <input type="text" placeholder="Body input" />
        </label>
        <p>content</p>
      </PageLayout>,
    )
    const main = document.querySelector('main.rmkl-page-body') as HTMLElement
    installScroller(main)
    windowScroll.set(100)
    act(() => handle.current!.scrollToBottom('auto'))
    // idle: the document is the scroller
    expect(scrollToSpy).toHaveBeenLastCalledWith({ top: document.documentElement.scrollHeight, behavior: 'auto' })
    scrollToSpy.mockClear()
    tap(bodyInput())
    main.scrollTop = -300
    act(() => handle.current!.scrollToBottom('auto'))
    // shell: the column-reverse scroller, whose end is 0; the document is not touched
    expect(main.scrollTop).toBe(0)
    expect(scrollToSpy).not.toHaveBeenCalled()
    expect(handle.current!.element).toBe(document.querySelector('.rmkl-page-root'))
  })
})

describe('PageLayout: the tap, not the touch, opens the shell', () => {
  it('does not focus on pointerdown alone', () => {
    renderPage()
    act(() => {
      bodyInput().dispatchEvent(new Event('pointerdown', { bubbles: true }))
    })
    expect(document.activeElement).not.toBe(bodyInput())
  })

  it('never focuses from a touch that turned into a scroll', () => {
    renderPage()
    act(() => {
      bodyInput().dispatchEvent(new Event('pointerdown', { bubbles: true }))
      bodyInput().dispatchEvent(new Event('pointercancel', { bubbles: true }))
      bodyInput().dispatchEvent(new Event('pointerup', { bubbles: true }))
    })
    expect(document.activeElement).not.toBe(bodyInput())
  })

  it('keeps the focus when the click of the same tap lands on whatever moved under the finger', () => {
    renderPage()
    tap(bodyInput())
    const stray = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    act(() => {
      screen.getByText('content').dispatchEvent(stray)
    })
    expect(stray.defaultPrevented).toBe(true)
  })

  it('ends the protection with the tap, not a clock: the next touch is a new gesture', () => {
    // the window used to be 600ms from the focus; a programmatic focus (no tap, so no click) left
    // it open and the next touch's mousedown was refused. A pointerdown means the previous tap is
    // over -- its click, if any, has already been delivered.
    renderPage()
    act(() => {
      bodyInput().focus()
    })
    act(() => {
      screen.getByText('content').dispatchEvent(new Event('pointerdown', { bubbles: true }))
    })
    const next = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    act(() => {
      screen.getByText('content').dispatchEvent(next)
    })
    expect(next.defaultPrevented).toBe(false)
  })

  it('stops protecting the focus once the click has landed', () => {
    renderPage()
    tap(bodyInput())
    const clickEv = new MouseEvent('click', { bubbles: true, cancelable: true })
    act(() => {
      bodyInput().dispatchEvent(clickEv)
    })
    expect(clickEv.defaultPrevented).toBe(true)
    const later = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    act(() => {
      screen.getByText('content').dispatchEvent(later)
    })
    expect(later.defaultPrevented).toBe(false)
  })
})
