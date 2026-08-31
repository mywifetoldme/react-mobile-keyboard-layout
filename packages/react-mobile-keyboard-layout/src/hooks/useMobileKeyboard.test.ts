import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMobileKeyboard } from './useMobileKeyboard'

describe('useMobileKeyboard hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.scrollTo = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with default metrics', () => {
    const bodyRef = { current: document.createElement('div') }
    const { result } = renderHook(() => useMobileKeyboard({ bodyRef }))

    expect(result.current.isKeyboardOpen).toBe(false)
    expect(result.current.isFloatingSuppressed).toBe(false)
    expect(result.current.activeInputType).toBe('none')
  })

  it('intercepts text inputs on pointerDown with preventScroll: true', () => {
    const bodyRef = { current: document.createElement('div') }
    const { result } = renderHook(() => useMobileKeyboard({ bodyRef }))

    const input = document.createElement('input')
    input.type = 'text'
    const focusSpy = vi.spyOn(input, 'focus')

    const fakeEvent = {
      target: input,
      stopPropagation: vi.fn(),
    } as unknown as React.PointerEvent<HTMLElement>

    act(() => {
      result.current.handleBodyPointerDown(fakeEvent)
    })

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
    expect(fakeEvent.stopPropagation).toHaveBeenCalled()
  })

  it('does NOT intercept date picker or non-keyboard inputs', () => {
    const bodyRef = { current: document.createElement('div') }
    const { result } = renderHook(() => useMobileKeyboard({ bodyRef }))

    const dateInput = document.createElement('input')
    dateInput.type = 'date'
    const focusSpy = vi.spyOn(dateInput, 'focus')

    const fakeEvent = {
      target: dateInput,
      stopPropagation: vi.fn(),
    } as unknown as React.PointerEvent<HTMLElement>

    act(() => {
      result.current.handleBodyPointerDown(fakeEvent)
    })

    expect(focusSpy).not.toHaveBeenCalled()
  })

  it('scrolls to bottom and updates baseline anchor', () => {
    const div = document.createElement('div')
    Object.defineProperty(div, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(div, 'clientHeight', { value: 400, configurable: true })
    const scrollToSpy = vi.fn()
    div.scrollTo = scrollToSpy

    const bodyRef = { current: div }
    const { result } = renderHook(() => useMobileKeyboard({ bodyRef }))

    act(() => {
      result.current.scrollToBottom('smooth')
    })

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 600, behavior: 'smooth' })
  })

  it('locks window to top when window.scrollY > 0', () => {
    Object.defineProperty(window, 'scrollY', { value: 50, configurable: true })
    const bodyRef = { current: document.createElement('div') }
    const { result } = renderHook(() => useMobileKeyboard({ bodyRef }))

    act(() => {
      result.current.lockToTop()
    })

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
