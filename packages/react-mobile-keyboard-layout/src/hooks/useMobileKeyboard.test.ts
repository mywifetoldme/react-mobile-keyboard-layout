import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMobileKeyboard, KEYBOARD_HEIGHT_CSS_VAR } from './useMobileKeyboard'

/** Minimal stand-in for window.visualViewport, which jsdom does not implement. */
class FakeVisualViewport extends EventTarget {
  constructor(public height: number) {
    super()
  }
}

const installViewport = (innerHeight: number, vvHeight: number) => {
  const vv = new FakeVisualViewport(vvHeight)
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true, writable: true })
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true, writable: true })
  return vv
}

const resizeViewport = (vv: FakeVisualViewport, height: number) => {
  act(() => {
    vv.height = height
    vv.dispatchEvent(new Event('resize'))
  })
}

const kbVar = () => document.documentElement.style.getPropertyValue(KEYBOARD_HEIGHT_CSS_VAR)

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

describe('useMobileKeyboard hook', () => {
  beforeEach(() => {
    frames = []
    now = 0
    window.scrollTo = vi.fn()
    window.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      frames.push(cb)
      return frames.length
    })
    window.cancelAnimationFrame = vi.fn(() => {
      frames = []
    })
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.replaceChildren()
    document.documentElement.style.removeProperty(KEYBOARD_HEIGHT_CSS_VAR)
  })

  it('publishes the keyboard-covered height as --rmkl-kb (the prototype --kb) and toggles isKeyboardOpen', () => {
    const vv = installViewport(700, 700)
    const { result } = renderHook(() => useMobileKeyboard())

    expect(kbVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(false)
    expect(result.current.containerStyle.paddingBottom).toBe('0px')

    // iOS keyboard: innerHeight stays, visualViewport shrinks by 337px
    resizeViewport(vv, 363)
    expect(kbVar()).toBe('337px')
    expect(result.current.isKeyboardOpen).toBe(true)
    expect(result.current.containerStyle.paddingBottom).toBe('337px')

    resizeViewport(vv, 700)
    expect(kbVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(false)
  })

  it('treats viewport changes below keyboardThreshold (browser toolbar) as keyboard closed', () => {
    const vv = installViewport(700, 700)
    const { result } = renderHook(() => useMobileKeyboard({ keyboardThreshold: 100 }))

    resizeViewport(vv, 650)
    expect(kbVar()).toBe('0px')
    expect(result.current.isKeyboardOpen).toBe(false)
  })

  it('reveals a focused body text input when the keyboard opens (scrollIntoView block: nearest), never for the floating bar', () => {
    const vv = installViewport(700, 700)
    const body = document.createElement('div')
    const input = document.createElement('input')
    input.type = 'text'
    body.appendChild(input)
    const floating = document.createElement('textarea')
    document.body.append(body, floating)
    input.scrollIntoView = vi.fn()
    floating.scrollIntoView = vi.fn()
    renderHook(() => useMobileKeyboard({ bodyRef: { current: body } }))

    input.focus()
    resizeViewport(vv, 363)
    runFrame(16)
    expect(input.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })

    floating.focus()
    resizeViewport(vv, 700)
    resizeViewport(vv, 363)
    runFrame(32)
    expect(floating.scrollIntoView).not.toHaveBeenCalled()
  })

  it('removes --rmkl-kb and stops listening to visualViewport on unmount', () => {
    const vv = installViewport(700, 363)
    const { unmount } = renderHook(() => useMobileKeyboard())
    expect(kbVar()).toBe('337px')

    unmount()
    expect(kbVar()).toBe('')

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

  it('cancels the top-lock on focusout (blur) instead of letting it run on', () => {
    installViewport(700, 700)
    const { result } = renderHook(() => useMobileKeyboard())
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    act(() => {
      result.current.floatingProps.onPointerDown(pointerDownOn(textarea))
    })
    expect(frames).toHaveLength(1)

    act(() => {
      window.dispatchEvent(new Event('focusout'))
    })
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
    expect(frames).toHaveLength(0)
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
