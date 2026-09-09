import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act, cleanup, screen } from '@testing-library/react'
import { LabSandbox } from './LabSandbox'
import { LABS_DATA } from '../data/labsData'

/**
 * EXP-04-B: the document scrolls while the keyboard is closed (4B) and a fixed shell takes over
 * while it is open (4A). What decides the mode is focus, in CSS (`:focus-within`, `:has()`).
 *
 * The one thing CSS cannot do is carry the reading position from the document into the shell's
 * own scroller, so JS does that once, at lock time. The document itself never moves: it is
 * capped at "scroll position + one viewport" so Safari's keyboard pan has nowhere to go, and
 * nothing is written back on unlock. Measured on device in the spike-lock experiment.
 */

const lab = LABS_DATA.find((l) => l.id === 'exp04_b')!

const VIEWPORT_HEIGHT = 800
/** Both scroll spaces hold the same content, so they scroll the same distance. */
const MAX_SCROLL = 1000

let scrollToSpy: ReturnType<typeof vi.fn>

/** jsdom has no layout: back window.scrollY with a number the test can move. */
const installWindowScroll = () => {
  let y = 0
  Object.defineProperty(window, 'scrollY', { get: () => y, configurable: true })
  Object.defineProperty(window, 'pageYOffset', { get: () => y, configurable: true })
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

/**
 * A column-reverse scroller: scrollTop is 0 at the bottom and negative toward the top, and the
 * browser clamps it to that range on every read and write.
 */
const installScroller = (el: HTMLElement) => {
  const scrollHeight = VIEWPORT_HEIGHT + MAX_SCROLL
  const clientHeight = VIEWPORT_HEIGHT
  let scrollTop = 0
  const clamp = (v: number) => Math.min(0, Math.max(-(scrollHeight - clientHeight), v))
  Object.defineProperty(el, 'scrollTop', {
    get: () => clamp(scrollTop),
    set: (v: number) => {
      scrollTop = clamp(v)
    },
    configurable: true,
  })
  Object.defineProperty(el, 'clientHeight', { get: () => clientHeight, configurable: true })
  Object.defineProperty(el, 'scrollHeight', { get: () => scrollHeight, configurable: true })
}

let frames = new Map<number, FrameRequestCallback>()
let nextFrameId = 1
const flushFrames = (times = 1) => {
  for (let i = 0; i < times; i++) {
    const pending = [...frames.values()]
    frames.clear()
    act(() => pending.forEach((cb) => cb(performance.now())))
  }
}

class FakeVisualViewport extends EventTarget {
  offsetTop = 0
  constructor(public height: number) {
    super()
  }
}

beforeEach(() => {
  frames = new Map()
  nextFrameId = 1
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    const id = nextFrameId++
    frames.set(id, cb)
    return id
  }) as typeof window.requestAnimationFrame
  window.cancelAnimationFrame = ((id: number) => {
    frames.delete(id)
  }) as typeof window.cancelAnimationFrame

  Object.defineProperty(window, 'visualViewport', {
    value: new FakeVisualViewport(VIEWPORT_HEIGHT),
    configurable: true,
    writable: true,
  })
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
  installScroller(main)
  return { main }
}

const css = () => [...document.querySelectorAll('style')].map((el) => el.textContent ?? '').join('\n')
/** The declarations of the first rule whose selector list contains `selector`. */
const ruleFor = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // anchored to the start of a rule, so `.root:focus-within` does not match `body:has(.root:focus-within)`
  return new RegExp(`(?:^|\\n)[ \\t]*${escaped}[ \\t]*\\{([^}]*)\\}`).exec(css())?.[1] ?? ''
}

/** The capture-phase handler reads `event.target`, so a plain bubbling Event is enough. */
const tap = (el: HTMLElement) => {
  act(() => {
    el.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  })
}
const blur = () => {
  act(() => {
    ;(document.activeElement as HTMLElement | null)?.blur()
  })
}

const floatingInput = () => screen.getByPlaceholderText('메시지 입력 (터치 시 4A App-Shell 자동 전환)...')
const bodyInput = () => screen.getByPlaceholderText('터치하여 본문 인풋 테스트 (자동 4A 전환)...')
const lockHeight = () => document.documentElement.style.getPropertyValue('--rmkl-lock-height')

describe('EXP-04-B: mode is decided by focus, in CSS', () => {
  it('hands the document to the browser while nothing is focused', () => {
    renderSandbox()
    // the showcase locks html/body for every other lab; this one has to undo that
    expect(ruleFor('body:has(.rmkl-exp04b-root)')).toMatch(/overflow:\s*visible/)
    expect(ruleFor('html:has(.rmkl-exp04b-root)')).toMatch(/overflow-y:\s*auto/)
  })

  it('caps and freezes the document, in CSS, the moment an input inside has focus', () => {
    renderSandbox()
    const lock = ruleFor('body:has(.rmkl-exp04b-root:focus-within)')
    expect(lock).toMatch(/height:\s*var\(--rmkl-lock-height\)/)
    expect(lock).toMatch(/overflow:\s*hidden/)
    expect(ruleFor('.rmkl-exp04b-root:focus-within')).toMatch(/position:\s*fixed/)
  })

  it('keeps the shell body bottom-anchored so the engine can hold a focused body input', () => {
    const { main } = renderSandbox()
    expect(getComputedStyle(main).flexDirection).toBe('column-reverse')
  })
})

describe('EXP-04-B: the one JS job -- carry the position into the shell, once', () => {
  it('publishes the lock height as "scroll position + viewport" before the layout flips', () => {
    renderSandbox()
    windowScroll.set(600)

    tap(floatingInput())

    expect(lockHeight()).toBe(`${600 + VIEWPORT_HEIGHT}px`)
  })

  it('transfers the reading position into the column-reverse scroller', () => {
    const { main } = renderSandbox()
    windowScroll.set(600)

    tap(floatingInput())

    // 0 is the bottom in column-reverse; the document's 600 from the top is 400 short of it
    expect(main.scrollTop).toBe(600 - MAX_SCROLL)
  })

  it('never moves the document -- not on lock, not on unlock', () => {
    renderSandbox()
    windowScroll.set(600)

    tap(floatingInput())
    flushFrames(6)
    blur()
    flushFrames(6)

    expect(scrollToSpy).not.toHaveBeenCalled()
    expect(window.scrollY).toBe(600)
  })

  it('does not re-lock when focus moves between inputs inside the shell', () => {
    const { main } = renderSandbox()
    windowScroll.set(600)
    tap(floatingInput())
    const height = lockHeight()
    const offset = main.scrollTop

    // the shell scrolled a little, then the user tapped a body input
    act(() => {
      main.scrollTop = offset + 50
    })
    windowScroll.set(0) // whatever the (frozen) document reports now must not be re-read
    tap(bodyInput())

    expect(lockHeight()).toBe(height)
    expect(main.scrollTop).toBe(offset + 50)
  })

  it('locks from a focus that arrives without a tap', () => {
    renderSandbox()
    windowScroll.set(600)

    act(() => {
      floatingInput().focus()
    })

    expect(lockHeight()).toBe(`${600 + VIEWPORT_HEIGHT}px`)
  })

  it('locks again on the next tap after the keyboard closed', () => {
    renderSandbox()
    windowScroll.set(600)
    tap(floatingInput())
    blur()
    windowScroll.set(900)

    tap(floatingInput())

    expect(lockHeight()).toBe(`${900 + VIEWPORT_HEIGHT}px`)
  })
})

describe('EXP-04-B: nothing in the content depends on the mode', () => {
  it('renders both mode labels at all times and lets CSS pick one', () => {
    renderSandbox()
    const before = document.querySelectorAll('.rmkl-exp04b-only-4a, .rmkl-exp04b-only-4b').length
    expect(before).toBeGreaterThan(0)

    tap(floatingInput())

    // a React mode state would swap copy here and change the content height under the scroller
    expect(document.querySelectorAll('.rmkl-exp04b-only-4a, .rmkl-exp04b-only-4b').length).toBe(before)
  })
})
