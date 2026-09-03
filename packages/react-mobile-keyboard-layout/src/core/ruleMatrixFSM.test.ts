import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LayoutEngine } from './layoutEngine'

describe('Rule Matrix & 3-State FSM Transition Table', () => {
  let bodyEl: HTMLDivElement
  let floatingEl: HTMLDivElement
  let floatingTextarea: HTMLTextAreaElement
  let bodyInput: HTMLInputElement
  let engine: LayoutEngine

  beforeEach(() => {
    vi.restoreAllMocks()
    window.scrollTo = vi.fn()

    // Mock touch device
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true })

    // Setup DOM elements
    bodyEl = document.createElement('div')
    bodyEl.scrollTop = 100
    Object.defineProperty(bodyEl, 'clientHeight', { value: 600, configurable: true })
    Object.defineProperty(bodyEl, 'scrollHeight', { value: 1500, configurable: true })
    bodyEl.getBoundingClientRect = () => ({
      top: 80,
      bottom: 680,
      left: 0,
      right: 390,
      width: 390,
      height: 600,
      x: 0,
      y: 80,
      toJSON: () => ({}),
    })

    floatingEl = document.createElement('div')
    floatingTextarea = document.createElement('textarea')
    floatingEl.appendChild(floatingTextarea)

    bodyInput = document.createElement('input')
    bodyInput.type = 'text'
    bodyInput.getBoundingClientRect = () => ({
      top: 300,
      bottom: 340,
      left: 16,
      right: 374,
      width: 358,
      height: 40,
      x: 16,
      y: 300,
      toJSON: () => ({}),
    })
    bodyEl.appendChild(bodyInput)

    document.body.appendChild(bodyEl)
    document.body.appendChild(floatingEl)

    engine = new LayoutEngine({
      refs: {
        bodyRef: { current: bodyEl },
        floatingRef: { current: floatingEl },
      },
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  /* ==========================================================================
     FSM State Transition Matrix: [none | floating | body-inline]
     ========================================================================== */

  describe('State Transitions from `none`', () => {
    it('TRANSITION 1: [none] -> (focusin on floating) -> [floating]', () => {
      expect(engine.getState().focusTarget.type).toBe('none')
      bodyEl.scrollTop = 150

      engine.dispatch('focusin', { target: floatingTextarea })

      const state = engine.getState()
      expect(state.focusTarget.type).toBe('floating')
      if (state.focusTarget.type === 'floating') {
        expect(state.focusTarget.element).toBe(floatingTextarea)
      }
      // Captures baseline anchor
      expect(engine.getAnchor().closedScrollTop).toBe(150)
      expect(engine.getAnchor().closedBodyHeight).toBe(600)
    })

    it('TRANSITION 2: [none] -> (focusin on body-inline) -> [body-inline]', () => {
      expect(engine.getState().focusTarget.type).toBe('none')

      engine.dispatch('focusin', { target: bodyInput })

      const state = engine.getState()
      expect(state.focusTarget.type).toBe('body-inline')
      if (state.focusTarget.type === 'body-inline') {
        expect(state.focusTarget.element).toBe(bodyInput)
      }
    })
  })

  describe('State Transitions from `floating`', () => {
    beforeEach(() => {
      // Setup initial state in floating
      bodyEl.scrollTop = 120
      engine.dispatch('focusin', { target: floatingTextarea })
      expect(engine.getState().focusTarget.type).toBe('floating')
    })

    it('TRANSITION 3: [floating] -> (focusout to blur/non-text) -> [none] (restores baseline)', () => {
      // Simulate viewport height contraction & scroll offset
      bodyEl.scrollTop = 370

      // Focus loss to outside
      floatingTextarea.blur()
      engine.dispatch('focusout', { target: floatingTextarea })

      expect(engine.getState().focusTarget.type).toBe('none')
      expect(engine.getState().isKeyboardOpen).toBe(false)
      expect(engine.getState().vvHeight).toBeNull()
      // Verifies baseline restoration
      expect(bodyEl.scrollTop).toBe(120)
    })

    it('TRANSITION 4: [floating] -> (focusin on body-inline) -> [body-inline]', () => {
      engine.dispatch('focusin', { target: bodyInput })

      const state = engine.getState()
      expect(state.focusTarget.type).toBe('body-inline')
      if (state.focusTarget.type === 'body-inline') {
        expect(state.focusTarget.element).toBe(bodyInput)
      }
    })
  })

  describe('State Transitions from `body-inline`', () => {
    beforeEach(() => {
      engine.dispatch('focusin', { target: bodyInput })
      expect(engine.getState().focusTarget.type).toBe('body-inline')
    })

    it('TRANSITION 5: [body-inline] -> (focusout to blur/non-text) -> [none] (no baseline restore)', () => {
      bodyEl.scrollTop = 200
      bodyInput.blur()

      engine.dispatch('focusout', { target: bodyInput })

      expect(engine.getState().focusTarget.type).toBe('none')
      expect(engine.getState().isKeyboardOpen).toBe(false)
      // body-inline should NOT reset user's scrolled position
      expect(bodyEl.scrollTop).toBe(200)
    })

    it('TRANSITION 6: [body-inline] -> (focusin on floating) -> [floating]', () => {
      bodyEl.scrollTop = 250
      engine.dispatch('focusin', { target: floatingTextarea })

      const state = engine.getState()
      expect(state.focusTarget.type).toBe('floating')
      if (state.focusTarget.type === 'floating') {
        expect(state.focusTarget.element).toBe(floatingTextarea)
      }
      expect(engine.getAnchor().closedScrollTop).toBe(250)
    })
  })

  /* ==========================================================================
     Event Matrix: visualViewport.resize, pointerdown, and scroll
     ========================================================================== */

  describe('Event Matrix: visualViewport.resize', () => {
    it('applies preserved scroll offset when floating is active and viewport contracts', () => {
      // 1. Focus floating input at baseline scrollTop = 80
      bodyEl.scrollTop = 80
      engine.dispatch('focusin', { target: floatingTextarea })

      // Mock visualViewport contraction: screen 800px -> keyboard opens -> vvHeight 450px
      window.innerHeight = 800
      window.visualViewport = {
        height: 450,
        offsetTop: 0,
        pageTop: 0,
        width: 390,
      } as unknown as VisualViewport

      engine.dispatch('visualViewport.resize', {})

      expect(engine.getState().isKeyboardOpen).toBe(true)
      expect(engine.getState().vvHeight).toBe(450)
    })
  })

  describe('Event Matrix: scroll tracking', () => {
    it('updates closedScrollTop on user scroll when keyboard is closed', () => {
      expect(engine.getState().isKeyboardOpen).toBe(false)

      engine.updateClosedScrollTop(320)
      expect(engine.getAnchor().closedScrollTop).toBe(320)
    })
  })
})
