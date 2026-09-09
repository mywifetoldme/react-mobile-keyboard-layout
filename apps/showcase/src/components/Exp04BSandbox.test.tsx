import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, act, cleanup, screen } from '@testing-library/react'
import { LabSandbox } from './LabSandbox'
import { LABS_DATA } from '../data/labsData'

/**
 * EXP-04-B switches between two layouts that scroll in *different coordinate spaces*:
 *
 *   4B (keyboard closed) — the document scrolls; the position lives in `window.scrollY`
 *   4A (keyboard open)   — the document is locked at 0 and the inner <main> scrolls
 *
 * The two spaces have different extents: the 4B document is `min-height: 240vh` tall, while
 * the 4A <main> is only as tall as its content minus the header and the keyboard. Every bug
 * covered here is a coordinate leaking from one space into the other.
 */

const lab = LABS_DATA.find((l) => l.id === 'exp04_b')!

const VIEWPORT_HEIGHT = 800
/** `min-height: 240vh` minus one viewport. */
const DOCUMENT_MAX_SCROLL = VIEWPORT_HEIGHT * 2.4 - VIEWPORT_HEIGHT
/** The inner <main> in 4A holds the same content but scrolls a much shorter distance. */
const BODY_MAX_SCROLL = 400

/** Minimal stand-in for window.visualViewport, which jsdom does not implement. */
class FakeVisualViewport extends EventTarget {
  offsetTop = 0
  constructor(public height: number) {
    super()
  }
}

let vv: FakeVisualViewport

/**
 * jsdom has no layout, so `window.scrollY` never moves and `scrollTo` is a stub.
 * Back both with one number, clamped the way a real document is.
 */
const installWindowScroll = () => {
  let y = 0
  const clamp = (next: number) => Math.max(0, Math.min(DOCUMENT_MAX_SCROLL, next))
  Object.defineProperty(window, 'scrollY', { get: () => y, configurable: true })
  Object.defineProperty(window, 'pageYOffset', { get: () => y, configurable: true })
  window.scrollTo = ((...args: unknown[]) => {
    const [a, b] = args
    const top = typeof a === 'object' && a !== null ? Number((a as ScrollToOptions).top ?? y) : Number(b ?? 0)
    y = clamp(top)
  }) as typeof window.scrollTo
  return {
    set: (next: number) => {
      y = clamp(next)
      window.dispatchEvent(new Event('scroll'))
    },
  }
}

let windowScroll: ReturnType<typeof installWindowScroll>

/**
 * jsdom stores whatever you assign to `scrollTop`; a real element clamps it to
 * `scrollHeight - clientHeight`. That clamp is the behaviour under test, so install it.
 */
const installScroller = (el: HTMLElement, maxScroll: number) => {
  let scrollTop = 0
  Object.defineProperty(el, 'scrollTop', {
    get: () => scrollTop,
    set: (v: number) => {
      scrollTop = Math.max(0, Math.min(maxScroll, v))
    },
    configurable: true,
  })
  Object.defineProperty(el, 'clientHeight', { get: () => VIEWPORT_HEIGHT, configurable: true })
  Object.defineProperty(el, 'scrollHeight', { get: () => VIEWPORT_HEIGHT + maxScroll, configurable: true })
  el.scrollBy = ((opts: ScrollToOptions) => {
    el.scrollTop = scrollTop + Number(opts?.top ?? 0)
  }) as typeof el.scrollBy
}

// rAF is driven by hand so the 500ms top-lock loop and the focusout debounce can be stepped.
let frames: FrameRequestCallback[] = []
const flushFrames = (times = 1) => {
  for (let i = 0; i < times; i++) {
    const pending = frames
    frames = []
    act(() => pending.forEach((cb) => cb(performance.now())))
  }
}

beforeEach(() => {
  frames = []
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    frames.push(cb)
    return frames.length
  }) as typeof window.requestAnimationFrame
  window.cancelAnimationFrame = (() => {}) as typeof window.cancelAnimationFrame

  vv = new FakeVisualViewport(VIEWPORT_HEIGHT)
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: VIEWPORT_HEIGHT, configurable: true, writable: true })

  windowScroll = installWindowScroll()

  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
})

afterEach(() => {
  cleanup()
  document.getElementById('root')?.remove()
  document.documentElement.removeAttribute('style')
  document.body.removeAttribute('style')
})

const renderSandbox = () => {
  render(<LabSandbox lab={lab} lang="ko" onClose={() => {}} />, {
    container: document.getElementById('root')!,
  })
  const main = document.querySelector('main.rmkl-exp04b-body') as HTMLElement
  installScroller(main, BODY_MAX_SCROLL)
  return { main }
}

/** The capture-phase handler only reads `event.target`, so a plain bubbling Event is enough. */
const tap = (el: Element) => {
  act(() => {
    el.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  })
}

const blurToBody = () => {
  act(() => {
    const active = document.activeElement as HTMLElement | null
    active?.blur()
    active?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  })
  // focusout is debounced through one animation frame
  flushFrames()
}

const bottomInput = () => screen.getByPlaceholderText('최하단 인풋 터치 ➔ 키보드 위로 스크롤 전개')

const isLocked = () => document.body.style.position === 'fixed'

describe('EXP-04-B dual-mode shell', () => {
  it('locks the document into 4A when a body input is tapped', () => {
    renderSandbox()
    windowScroll.set(800)

    tap(bottomInput())

    expect(isLocked()).toBe(true)
    expect(window.scrollY).toBe(0)
  })

  it('restores the 4B reading position after the keyboard is dismissed', () => {
    renderSandbox()
    windowScroll.set(800)

    tap(bottomInput())
    blurToBody()

    expect(isLocked()).toBe(false)
    expect(window.scrollY).toBe(800)
  })

  it('restores the 4B reading position even when the 4A body scrolled to reveal the input', () => {
    const { main } = renderSandbox()
    windowScroll.set(800)

    tap(bottomInput())
    // the reveal pass scrolls the inner container; it must not redefine the window position
    act(() => {
      main.scrollTop = BODY_MAX_SCROLL
    })
    blurToBody()

    expect(window.scrollY).toBe(800)
  })
})
