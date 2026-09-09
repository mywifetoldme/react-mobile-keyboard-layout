import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMobileKeyboard, KEYBOARD_HEIGHT_CSS_VAR, KEYBOARD_INSET_CSS_VAR } from './useMobileKeyboard'

/** Minimal stand-in for window.visualViewport, which jsdom does not implement. */
class FakeVisualViewport extends EventTarget {
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

const pointerDownOn = (el: Element) => ({ target: el }) as unknown as PointerEvent

// rAF is driven by hand so the top-lock loop can be stepped frame by frame
let frames: FrameRequestCallback[] = []
let now = 0
const runFrame = (at: number) => {
  now = at
  const pending = frames
  frames = []
  pending.forEach((cb) => cb(at))
}

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
  const input = document.createElement('input')
  input.type = 'text'
  input.scrollIntoView = vi.fn()
  input.getBoundingClientRect = () => ({ top: clientHeight - 400 - scrollTop }) as DOMRect
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

describe('useMobileKeyboard hook', () => {
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
    const { result } = renderHook(() => useMobileKeyboard())

    expect(kbVar()).toBe('0px')
    expect(insetVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(false)
    expect(result.current.containerStyle.paddingBottom).toBe('0px')

    // iOS Safari: innerHeight stays, visualViewport shrinks by 337px → the keyboard covers 337px
    resizeViewport(vv, 363)
    expect(kbVar()).toBe('337px')
    expect(insetVar()).toBe('337px')
    expect(result.current.isKeyboardOpen).toBe(true)
    expect(result.current.containerStyle.paddingBottom).toBe('337px')

    resizeViewport(vv, 700)
    expect(kbVar()).toBe('0px')
    expect(insetVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(false)
  })

  it('reads the keyboard height from the layout viewport shrinking (Chrome for iOS, Android) — nothing is covered, so the inset stays 0', () => {
    const vv = installViewport(700, 700)
    const { result } = renderHook(() => useMobileKeyboard())
    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)
    input.focus() // the viewport only shrinks this way while a text input has the focus

    resizeLayoutViewport(vv, 363)
    expect(kbVar()).toBe('337px')
    expect(insetVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(true)
    expect(result.current.containerStyle.paddingBottom).toBe('0px')

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
    const { result } = renderHook(() => useMobileKeyboard({ keyboardThreshold: 100 }))

    resizeViewport(vv, 650)
    expect(kbVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(false)
  })

  it('keeps a focused body input still when the body shrinks or grows, and reveals it (scrollIntoView block: nearest) when it shrinks', () => {
    installViewport(700, 700)
    const { body, input, sizeBody, inputTop } = makeBody(600)
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))

    body.scrollTop = -200 // the feed is scrolled up a bit
    input.focus()
    expect(inputTop()).toBe(400)

    sizeBody(263) // keyboard: the body lost 337px at the bottom; bottom-anchoring moved the input up
    expect(inputTop()).toBe(400) // …and it was put back
    expect(body.scrollTop).toBe(-537)
    expect(input.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' })

    input.blur()
    sizeBody(600) // the body got its space back right after the blur
    expect(inputTop()).toBe(400)
    expect(body.scrollTop).toBe(-200)
  })

  it('does not over-correct when the browser already clamped the offset as the body grew', () => {
    installViewport(700, 700)
    const { body, input, sizeBody, inputTop } = makeBody(600)
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))

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
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))

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
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))

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

  it('corrects the scroll offset once even when two hook instances share the body (SubpageLayout next to the caller)', () => {
    installViewport(700, 700)
    const { body, input, sizeBody, inputTop } = makeBody(600)
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))

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
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))

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
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))

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

  it('takes the offset at the moment the floating bar gains focus as the one to hold', () => {
    // a caller may move the body right before focusing the bar (EXP-04-B hands the document's
    // reading position over in a capture-phase focusin); no scroll event has been delivered yet
    installViewport(700, 700)
    const { body, setHeight, notifyResize } = makeBody(600)
    const floating = document.createElement('textarea')
    document.body.appendChild(floating)
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))

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
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))

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
    const { unmount } = renderHook(() => useMobileKeyboard())
    expect(kbVar()).toBe('337px')

    unmount()
    expect(kbVar()).toBe('')
    expect(insetVar()).toBe('')

    resizeViewport(vv, 300)
    expect(kbVar()).toBe('')
  })

  it('bodyProps.onPointerDown focuses text inputs with preventScroll: true and runs the fallback top-lock', () => {
    installViewport(700, 700)
    const { result } = renderHook(() => useMobileKeyboard({ lockDurationMs: 350 }))
    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)
    const focusSpy = vi.spyOn(input, 'focus')

    act(() => {
      result.current.bodyProps.onPointerDown(pointerDownOn(input))
    })

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
    expect(frames).toHaveLength(1)

    // iOS panned the window anyway → the lock puts it back
    Object.defineProperty(window, 'scrollY', { value: 42, configurable: true, writable: true })
    runFrame(16)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    expect(frames).toHaveLength(1) // still inside lockDurationMs

    runFrame(400)
    expect(frames).toHaveLength(0) // lock ended by itself
  })

  it('bodyProps.onPointerDown intercepts only isKeyboardTextInput targets: date pickers, selects and buttons keep the native default action', () => {
    installViewport(700, 700)
    const { result } = renderHook(() => useMobileKeyboard())
    const dateInput = document.createElement('input')
    dateInput.type = 'date'

    for (const el of [dateInput, document.createElement('select'), document.createElement('button')]) {
      document.body.appendChild(el)
      const focusSpy = vi.spyOn(el, 'focus')
      act(() => {
        result.current.bodyProps.onPointerDown(pointerDownOn(el))
      })
      expect(focusSpy).not.toHaveBeenCalled()
    }
    expect(frames).toHaveLength(0)
  })

  it('runs the top-lock once more on focusout of a text input (the keyboard leaves) and lets it end by itself', () => {
    installViewport(700, 700)
    renderHook(() => useMobileKeyboard({ lockDurationMs: 350 }))
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    textarea.focus()
    act(() => textarea.blur())
    expect(frames).toHaveLength(1)

    runFrame(400)
    expect(frames).toHaveLength(0)
  })

  it('lockDurationMs: 0 turns the fallback top-lock off entirely: neither the tap nor the focusout touches the window', () => {
    installViewport(700, 700)
    const { result } = renderHook(() => useMobileKeyboard({ lockDurationMs: 0 }))
    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)

    // a layout that keeps the window at a non-zero offset on purpose (EXP-04-B's unlocked document)
    // must be able to opt out; a single "duration 0" step would still scroll it to 0
    act(() => {
      result.current.bodyProps.onPointerDown(pointerDownOn(input))
    })
    expect(frames).toHaveLength(0)

    input.focus()
    act(() => input.blur())
    expect(frames).toHaveLength(0)
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('scrollToBottom scrolls to the end, which is scrollTop 0 for a column-reverse body', () => {
    installViewport(700, 700)
    const div = document.createElement('div')
    Object.defineProperty(div, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(div, 'clientHeight', { value: 400, configurable: true })
    div.scrollTo = vi.fn()
    document.body.appendChild(div)
    const { result } = renderHook(() => useMobileKeyboard({ bodyRef: { current: div } }))

    act(() => result.current.scrollToBottom('smooth'))
    expect(div.scrollTo).toHaveBeenCalledWith({ top: 600, behavior: 'smooth' })

    div.style.display = 'flex'
    div.style.flexDirection = 'column-reverse'
    act(() => result.current.scrollToBottom('auto'))
    expect(div.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' })
  })
})
