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

  it('initializes with default metrics and grouped props', () => {
    const bodyRef = { current: document.createElement('div') }
    const { result } = renderHook(() => useMobileKeyboard({ bodyRef }))

    expect(result.current.isKeyboardOpen).toBe(false)
    expect(result.current.isFloatingSuppressed).toBe(false)
    expect(typeof result.current.floatingProps.onFocus).toBe('function')
    expect(typeof result.current.floatingProps.onBlur).toBe('function')
    expect(typeof result.current.bodyProps.onPointerDown).toBe('function')
    expect(typeof result.current.scrollToBottom).toBe('function')
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
      result.current.bodyProps.onPointerDown(fakeEvent)
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
      result.current.bodyProps.onPointerDown(fakeEvent)
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

  it('supports injecting custom declarative layout rules', () => {
    const customRuleApplied = vi.fn()
    const customRules = [
      {
        on: 'focusin' as const,
        when: [() => true],
        apply: () => {
          customRuleApplied()
          return { isKeyboardOpen: true }
        },
      },
    ]

    const bodyEl = document.createElement('div')
    const input = document.createElement('input')
    bodyEl.appendChild(input)

    const bodyRef = { current: bodyEl }
    const { result } = renderHook(() =>
      useMobileKeyboard({
        bodyRef,
        rules: customRules,
        alignPadding: 24,
      }),
    )

    act(() => {
      bodyEl.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })

    expect(customRuleApplied).toHaveBeenCalled()
    expect(result.current.isKeyboardOpen).toBe(true)
  })

  it('reactively updates isFloatingSuppressed based on FSM body-inline state', () => {
    const bodyEl = document.createElement('div')
    const input = document.createElement('input')
    input.type = 'text'
    bodyEl.appendChild(input)
    document.body.appendChild(bodyEl)

    const bodyRef = { current: bodyEl }
    const { result } = renderHook(() => useMobileKeyboard({ bodyRef }))

    expect(result.current.isFloatingSuppressed).toBe(false)

    act(() => {
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })

    // Once body inline input receives focus, isFloatingSuppressed becomes true
    expect(result.current.isFloatingSuppressed).toBe(true)

    document.body.removeChild(bodyEl)
  })
})
