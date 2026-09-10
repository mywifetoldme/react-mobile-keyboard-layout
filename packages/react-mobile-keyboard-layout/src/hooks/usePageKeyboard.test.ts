import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePageKeyboard, KEYBOARD_HEIGHT_CSS_VAR, KEYBOARD_INSET_CSS_VAR } from './usePageKeyboard'

/** Minimal stand-in for window.visualViewport, which jsdom does not implement. */
class FakeVisualViewport extends EventTarget {
  scale = 1
  constructor(public height: number) {
    super()
  }
}

const setInnerHeight = (px: number) =>
  Object.defineProperty(window, 'innerHeight', { value: px, configurable: true, writable: true })

const installViewport = (innerHeight: number, vvHeight: number) => {
  const vv = new FakeVisualViewport(vvHeight)
  setInnerHeight(innerHeight)
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true, writable: true })
  return vv
}

/** Safari-style keyboard: the layout viewport stays, only the visual viewport shrinks */
const resizeViewport = (vv: FakeVisualViewport, height: number) => {
  act(() => {
    vv.height = height
    vv.dispatchEvent(new Event('resize'))
  })
}

/** Chrome for iOS / Android-style keyboard: the layout viewport itself shrinks */
const resizeLayoutViewport = (vv: FakeVisualViewport, height: number) => {
  act(() => {
    setInnerHeight(height)
    vv.height = height
    window.dispatchEvent(new Event('resize'))
    vv.dispatchEvent(new Event('resize'))
  })
}

const cssVar = (name: string) => document.documentElement.style.getPropertyValue(name)
const kbVar = () => cssVar(KEYBOARD_HEIGHT_CSS_VAR)
const insetVar = () => cssVar(KEYBOARD_INSET_CSS_VAR)


// performance.now() is stubbed so the tests can state that no timing is involved
let frames: FrameRequestCallback[] = []
let now = 0

// ResizeObserver is driven by hand too: `sizeBody` changes the mocked clientHeight and notifies
let resizeCallbacks: ResizeObserverCallback[] = []
class FakeResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    resizeCallbacks.push(cb)
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

/**
 * A column-reverse body whose clientHeight/scrollTop can be set from the test, with one text input
 * whose screen position follows the box like a real bottom-anchored container:
 *   top = clientHeight − 400 − scrollTop   (400 = distance from the input's top to the content's bottom)
 */
const makeBody = (height: number) => {
  const body = document.createElement('div')
  body.style.display = 'flex'
  body.style.flexDirection = 'column-reverse'
  let clientHeight = height
  let scrollTop = 0
  Object.defineProperty(body, 'clientHeight', { get: () => clientHeight, configurable: true })
  Object.defineProperty(body, 'scrollTop', { get: () => scrollTop, set: (v: number) => (scrollTop = v), configurable: true })
  body.getBoundingClientRect = () => ({ top: 0, bottom: clientHeight, height: clientHeight }) as DOMRect
  body.scrollBy = vi.fn() as unknown as typeof body.scrollBy
  const input = document.createElement('input')
  input.type = 'text'
  input.scrollIntoView = vi.fn()
  input.getBoundingClientRect = () => ({ top: clientHeight - 400 - scrollTop, bottom: clientHeight - 400 - scrollTop + 40 }) as DOMRect
  body.appendChild(input)
  document.body.appendChild(body)
  const setHeight = (px: number) => {
    clientHeight = px
  }
  const notifyResize = () => act(() => resizeCallbacks.forEach((cb) => cb([], {} as ResizeObserver)))
  const sizeBody = (px: number) => {
    setHeight(px)
    notifyResize()
  }
  const inputTop = () => input.getBoundingClientRect().top
  return { body, input, sizeBody, setHeight, notifyResize, inputTop }
}

describe('usePageKeyboard (PageLayout\'s own hook)', () => {
  beforeEach(() => {
    frames = []
    now = 0
    resizeCallbacks = []
    window.scrollTo = vi.fn()
    window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      frames.push(cb)
      return frames.length
    })
    window.cancelAnimationFrame = vi.fn(() => {
      frames = []
    })
    ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.replaceChildren()
    document.documentElement.style.removeProperty(KEYBOARD_HEIGHT_CSS_VAR)
    document.documentElement.style.removeProperty(KEYBOARD_INSET_CSS_VAR)
  })

  it('publishes the keyboard height as --rmkl-kb (the prototype --kb) and the covered inset as --rmkl-kb-inset on Safari', () => {
    const vv = installViewport(700, 700)
    const { result } = renderHook(() => usePageKeyboard())

    expect(kbVar()).toBe('0px')
    expect(insetVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(false)
    expect(result.current.keyboardInset).toBe(0)

    // iOS Safari: innerHeight stays, visualViewport shrinks by 337px → the keyboard covers 337px
    resizeViewport(vv, 363)
    expect(kbVar()).toBe('337px')
    expect(insetVar()).toBe('337px')
    expect(result.current.isKeyboardOpen).toBe(true)
    expect(result.current.keyboardInset).toBe(337)

    resizeViewport(vv, 700)
    expect(kbVar()).toBe('0px')
    expect(insetVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(false)
  })

  it('measures the keyboard in layout pixels under pinch zoom: the visual viewport reports zoomed CSS pixels', () => {
    // innerHeight is in layout pixels and does not change with zoom; visualViewport.height is the
    // number of CSS pixels visible, i.e. divided by the scale. Read without the scale, a 2x zoom
    // alone looked like a 348px keyboard, and a 2x zoom over a 303px keyboard like 499px.
    const vv = installViewport(695, 695)
    renderHook(() => usePageKeyboard())
    act(() => {
      vv.scale = 2
      vv.height = 347.5
      vv.dispatchEvent(new Event('resize'))
    })
    expect(kbVar()).toBe('0px')
    act(() => {
      vv.height = 196 // 392 layout px visible above the keyboard, at 2x
      vv.dispatchEvent(new Event('resize'))
    })
    expect(kbVar()).toBe('303px')
    expect(insetVar()).toBe('303px')
  })

  it('re-measures when innerHeight comes back on a scroll, not a resize -- iOS restores the layout viewport silently', () => {
    // device: as the keyboard opens Safari shrinks innerHeight 735 -> 400 with the visual viewport at
    // 392 (inset 8); a layout's guard scrolls the window back and innerHeight returns to 735 with only
    // scroll events fired. Measured only on resize, the inset stayed 8px and the composer sat 335px
    // behind the keyboard.
    const vv = installViewport(735, 735)
    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)
    renderHook(() => usePageKeyboard())
    input.focus()
    act(() => {
      setInnerHeight(400)
      vv.height = 392
      vv.dispatchEvent(new Event('resize'))
    })
    expect(insetVar()).toBe('8px')
    act(() => {
      setInnerHeight(735)
      vv.dispatchEvent(new Event('scroll'))
    })
    expect(insetVar()).toBe('343px')
    expect(kbVar()).toBe('343px')
    input.remove()
  })

  it('reads the keyboard height from the layout viewport shrinking (Chrome for iOS, Android) — nothing is covered, so the inset stays 0', () => {
    const vv = installViewport(700, 700)
    const { result } = renderHook(() => usePageKeyboard())
    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)
    input.focus() // the viewport only shrinks this way while a text input has the focus

    resizeLayoutViewport(vv, 363)
    expect(kbVar()).toBe('337px')
    expect(insetVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(true)
    expect(result.current.keyboardInset).toBe(0)

    resizeLayoutViewport(vv, 700)
    expect(kbVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(false)

    // with nothing focused, a smaller window (toolbars, rotation) is just the new closed height
    input.blur()
    resizeLayoutViewport(vv, 600)
    expect(kbVar()).toBe('0px')
  })

  it('treats viewport changes below keyboardThreshold (browser toolbar) as keyboard closed', () => {
    const vv = installViewport(700, 700)
    const { result } = renderHook(() => usePageKeyboard({ keyboardThreshold: 100 }))

    resizeViewport(vv, 650)
    expect(kbVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(false)
  })

  it('keeps a focused body input still when the body shrinks or grows, and reveals it by scrolling the body only when it shrinks', () => {
    installViewport(700, 700)
    const { body, input, sizeBody, inputTop } = makeBody(600)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    body.scrollTop = -200 // the feed is scrolled up a bit
    input.focus()
    expect(inputTop()).toBe(400)

    sizeBody(263) // keyboard: the body lost 337px at the bottom; bottom-anchoring moved the input up
    expect(inputTop()).toBe(400) // …and it was put back
    expect(body.scrollTop).toBe(-537)
    // the input (400..440) now sits below the box (263): the body scrolls it in, smoothly, and
    // nothing else -- scrollIntoView could scroll the document too and take the header with it
    expect(body.scrollBy).toHaveBeenCalledWith({ top: 177, behavior: 'smooth' })
    expect(input.scrollIntoView).not.toHaveBeenCalled()

    input.blur()
    sizeBody(600) // the body got its space back right after the blur
    expect(inputTop()).toBe(400)
    expect(body.scrollTop).toBe(-200)
  })

  it('keeps the input still through the close however long the close takes -- the grace is the close, not a clock', () => {
    // the grace window used to be 1000ms from the blur; a slow close (or a slow device) fell out of
    // it and the newest line slid. The window is now "until the next keyboard input takes the focus".
    installViewport(700, 700)
    const { body, input, sizeBody, inputTop } = makeBody(600)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    body.scrollTop = -200
    input.focus()
    sizeBody(263)
    expect(inputTop()).toBe(400)
    input.blur()
    now = 5000 // far longer than any grace timer
    sizeBody(600)
    expect(inputTop()).toBe(400)
    expect(body.scrollTop).toBe(-200)
  })

  it('does not over-correct when the browser already clamped the offset as the body grew', () => {
    installViewport(700, 700)
    const { body, input, sizeBody, inputTop } = makeBody(600)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    body.scrollTop = -200
    input.focus()
    sizeBody(263)
    expect(body.scrollTop).toBe(-537)

    input.blur()
    body.scrollTop = -200 // the browser clamped the offset to the new range before the observer ran
    sizeBody(600)
    expect(inputTop()).toBe(400)
    expect(body.scrollTop).toBe(-200)
  })

  it('follows the user scrolling the body while the input is focused: the position kept on close is the new one', () => {
    installViewport(700, 700)
    const { body, input, sizeBody, inputTop } = makeBody(600)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    body.scrollTop = -200
    input.focus()
    sizeBody(263)
    expect(inputTop()).toBe(400)

    body.scrollTop = -400 // the user scrolled up while typing
    body.dispatchEvent(new Event('scroll'))
    expect(inputTop()).toBe(263)

    input.blur()
    sizeBody(600)
    expect(inputTop()).toBe(263) // kept where the user left it, not where it was when focused
    expect(body.scrollTop).toBe(-63)
  })

  it('ignores the scroll event the browser fires while clamping the offset to the grown box (that is not the user scrolling)', () => {
    installViewport(700, 700)
    const { body, input, sizeBody, setHeight, notifyResize, inputTop } = makeBody(600)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    body.scrollTop = -200
    input.focus()
    sizeBody(263)
    expect(body.scrollTop).toBe(-537)

    input.blur()
    // the box grew, the browser clamped -537 to the new range and fired scroll — all before the observer ran
    setHeight(600)
    body.scrollTop = -300
    body.dispatchEvent(new Event('scroll'))
    expect(inputTop()).toBe(500)

    notifyResize()
    expect(inputTop()).toBe(400) // back where it was while typing
    expect(body.scrollTop).toBe(-200)
  })

  it('corrects the scroll offset once even when two hook instances share the body (PageLayout next to the caller)', () => {
    installViewport(700, 700)
    const { body, input, sizeBody, inputTop } = makeBody(600)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    input.focus()
    sizeBody(263)
    expect(inputTop()).toBe(600 - 400) // where it was before the keyboard
    expect(body.scrollTop).toBe(-337)
  })

  it('keeps the bottom edge in view while the floating bar (outside the body) has the focus', () => {
    // WebKit keeps the TOP-based offset when a column-reverse box changes height: a body scrolled
    // up by 200px and shrunk by 337px lands at -537, and the newest 337px slide behind the
    // keyboard (measured on iPhone: -2347 -> -2690 for a 343px inset). Only at scrollTop 0 does it
    // look bottom-anchored, which is why a chat sitting at its end never showed this.
    installViewport(700, 700)
    const { body, setHeight, notifyResize } = makeBody(600)
    const floating = document.createElement('textarea')
    document.body.appendChild(floating)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    body.scrollTop = -200
    body.dispatchEvent(new Event('scroll'))
    floating.focus()

    setHeight(263)
    body.scrollTop = -200 - 337 // what the browser did before the observer ran
    notifyResize()
    expect(body.scrollTop).toBe(-200) // the same content sits above the keyboard as before

    setHeight(600)
    body.scrollTop = -200 + 337
    notifyResize()
    expect(body.scrollTop).toBe(-200)
  })

  it('holds the bottom edge for the floating bar even after a body input was used earlier', () => {
    // the body-input anchor stays set after that input blurs (its grace window needs it); it must
    // not keep the floating bar's turn from ever running -- on device the fix was dead code until
    // the page was reloaded
    installViewport(700, 700)
    const { body, input, setHeight, notifyResize } = makeBody(600)
    const floating = document.createElement('textarea')
    document.body.appendChild(floating)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    input.focus()
    input.blur()
    now = 5000 // well past the blur grace window

    body.scrollTop = -200
    floating.focus()
    setHeight(263)
    body.scrollTop = -200 - 337
    notifyResize()

    expect(body.scrollTop).toBe(-200)
  })

  it('gives the bar its turn even inside the blur grace window of a body input', () => {
    // bottom input tapped, dismissed, and the composer tapped right away (within BLUR_GRACE_MS):
    // the grace window is for the body input's own close, not for a new lock -- on device the
    // anchor path rewound the shell to where the body input had been
    installViewport(700, 700)
    const { body, input, setHeight, notifyResize } = makeBody(600)
    const floating = document.createElement('textarea')
    document.body.appendChild(floating)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    input.focus()
    input.blur()
    now = 500 // still inside the grace window

    body.scrollTop = -200
    floating.focus()
    setHeight(263)
    body.scrollTop = -200 - 337
    notifyResize()

    expect(body.scrollTop).toBe(-200)
  })

  it('takes the offset at the moment the floating bar gains focus as the one to hold', () => {
    // a caller may move the body right before focusing the bar (EXP-04-B hands the document's
    // reading position over in a capture-phase focusin); no scroll event has been delivered yet
    installViewport(700, 700)
    const { body, setHeight, notifyResize } = makeBody(600)
    const floating = document.createElement('textarea')
    document.body.appendChild(floating)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    body.scrollTop = -1500 // set synchronously, no scroll event
    floating.focus()
    setHeight(263)
    body.scrollTop = -1500 - 337
    notifyResize()

    expect(body.scrollTop).toBe(-1500)
  })

  it('does not fight the user scrolling the body while the floating bar has the focus', () => {
    installViewport(700, 700)
    const { body, setHeight, notifyResize } = makeBody(600)
    const floating = document.createElement('textarea')
    document.body.appendChild(floating)
    renderHook(() => usePageKeyboard({ bodyRef: { current: body } }))

    floating.focus()
    setHeight(263)
    body.scrollTop = -337
    notifyResize()
    expect(body.scrollTop).toBe(0) // opened at the end: still at the end

    body.scrollTop = -500 // the user scrolls up while typing
    body.dispatchEvent(new Event('scroll'))
    setHeight(600)
    body.scrollTop = -500 + 337
    notifyResize()
    expect(body.scrollTop).toBe(-500) // the position they chose survives the keyboard leaving
  })

  it('removes --rmkl-kb and --rmkl-kb-inset and stops listening to visualViewport on unmount', () => {
    const vv = installViewport(700, 363)
    const { unmount } = renderHook(() => usePageKeyboard())
    expect(kbVar()).toBe('337px')

    unmount()
    expect(kbVar()).toBe('')
    expect(insetVar()).toBe('')

    resizeViewport(vv, 300)
    expect(kbVar()).toBe('')
  })

  it('scrollToBottom scrolls to the end, which is scrollTop 0 for a column-reverse body', () => {
    installViewport(700, 700)
    const div = document.createElement('div')
    Object.defineProperty(div, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(div, 'clientHeight', { value: 400, configurable: true })
    div.scrollTo = vi.fn()
    document.body.appendChild(div)
    const { result } = renderHook(() => usePageKeyboard({ bodyRef: { current: div } }))

    act(() => result.current.scrollToBottom('smooth'))
    expect(div.scrollTo).toHaveBeenCalledWith({ top: 600, behavior: 'smooth' })

    div.style.display = 'flex'
    div.style.flexDirection = 'column-reverse'
    act(() => result.current.scrollToBottom('auto'))
    expect(div.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' })
  })
})
