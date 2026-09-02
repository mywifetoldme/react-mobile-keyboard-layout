import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LayoutEngine } from './layoutEngine'

describe('LayoutEngine Reference-Driven Rule FSM', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.scrollTo = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with default closed state and 0 baseline anchor', () => {
    const engine = new LayoutEngine()
    expect(engine.getState().focusTarget.type).toBe('none')
    expect(engine.getState().isKeyboardOpen).toBe(false)
    expect(engine.getAnchor().closedScrollTop).toBe(0)
    expect(engine.getAnchor().closedBodyHeight).toBeNull()
  })

  it('transitions to floating focus when focusin occurs inside floatingRef', () => {
    const floatingDiv = document.createElement('div')
    const textarea = document.createElement('textarea')
    floatingDiv.appendChild(textarea)

    const bodyDiv = document.createElement('div')
    bodyDiv.scrollTop = 120
    Object.defineProperty(bodyDiv, 'clientHeight', { value: 600, configurable: true })

    const engine = new LayoutEngine({
      refs: {
        bodyRef: { current: bodyDiv },
        floatingRef: { current: floatingDiv },
      },
    })

    engine.dispatch('focusin', { target: textarea })

    expect(engine.getState().focusTarget.type).toBe('floating')
    expect(engine.getAnchor().closedScrollTop).toBe(120)
    expect(engine.getAnchor().closedBodyHeight).toBe(600)
  })

  it('transitions to body-inline focus when focusin occurs inside bodyRef', () => {
    const bodyDiv = document.createElement('div')
    const textInput = document.createElement('input')
    textInput.type = 'text'
    bodyDiv.appendChild(textInput)

    const engine = new LayoutEngine({
      refs: { bodyRef: { current: bodyDiv } },
    })

    engine.dispatch('focusin', { target: textInput })

    expect(engine.getState().focusTarget.type).toBe('body-inline')
  })

  it('preserves scroll position with Delta_H on body resize while in floating focus', () => {
    const bodyDiv = document.createElement('div')
    bodyDiv.scrollTop = 100
    Object.defineProperty(bodyDiv, 'clientHeight', { value: 600, configurable: true })

    const floatingDiv = document.createElement('div')
    const textarea = document.createElement('textarea')
    floatingDiv.appendChild(textarea)

    const engine = new LayoutEngine({
      refs: {
        bodyRef: { current: bodyDiv },
        floatingRef: { current: floatingDiv },
      },
    })

    // 1. Focus floating input
    engine.dispatch('focusin', { target: textarea })
    engine.setState({ isKeyboardOpen: true })

    // 2. Simulate body height contraction from 600px to 350px (Delta_H = 250px)
    engine.dispatch('resize', {
      contentRect: { height: 350 },
    })

    // S_new = 100 + (600 - 350) = 350px
    expect(bodyDiv.scrollTop).toBe(350)
  })

  it('does NOT jump scroll position on body resize while in body-inline focus', () => {
    const bodyDiv = document.createElement('div')
    bodyDiv.scrollTop = 150
    Object.defineProperty(bodyDiv, 'clientHeight', { value: 600, configurable: true })
    bodyDiv.getBoundingClientRect = () => ({
      top: 84,
      bottom: 684,
      left: 0,
      right: 390,
      width: 390,
      height: 600,
      x: 0,
      y: 84,
      toJSON: () => {},
    })

    const textInput = document.createElement('input')
    textInput.type = 'text'
    textInput.getBoundingClientRect = () => ({
      top: 100,
      bottom: 140,
      left: 0,
      right: 100,
      width: 100,
      height: 40,
      x: 0,
      y: 100,
      toJSON: () => {},
    })
    bodyDiv.appendChild(textInput)

    const engine = new LayoutEngine({
      refs: { bodyRef: { current: bodyDiv } },
    })

    // 1. Focus body inline input
    engine.dispatch('focusin', { target: textInput })
    engine.setState({ isKeyboardOpen: true })

    // 2. Simulate resize
    engine.dispatch('resize', {
      contentRect: { height: 350 },
    })

    // Scroll must stay naturally at 150px without artificial jumps
    expect(bodyDiv.scrollTop).toBe(150)
  })

  it('restores baseline S_0 on global focusout from floating input', () => {
    const bodyDiv = document.createElement('div')
    bodyDiv.scrollTop = 100
    Object.defineProperty(bodyDiv, 'clientHeight', { value: 600, configurable: true })

    const floatingDiv = document.createElement('div')
    const textarea = document.createElement('textarea')
    floatingDiv.appendChild(textarea)

    const engine = new LayoutEngine({
      refs: {
        bodyRef: { current: bodyDiv },
        floatingRef: { current: floatingDiv },
      },
    })

    // 1. Focus floating input at scrollTop 100
    engine.dispatch('focusin', { target: textarea })
    engine.setState({ isKeyboardOpen: true })

    // 2. Scrolled while keyboard open
    bodyDiv.scrollTop = 350

    // 3. Focus out to body (dismiss keyboard)
    document.body.focus()
    engine.dispatch('focusout', { target: textarea })

    expect(engine.getState().focusTarget.type).toBe('none')
    expect(engine.getState().isKeyboardOpen).toBe(false)
    expect(bodyDiv.scrollTop).toBe(100) // S_0 restored!
  })
})
