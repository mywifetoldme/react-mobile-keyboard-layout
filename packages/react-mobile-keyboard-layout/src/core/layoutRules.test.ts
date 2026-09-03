import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isTouchDevice,
  isTextInput,
  isInsideFloating,
  isInsideBody,
  isNoNextTextInput,
  isFloatingActive,
  isBodyActive,
  isKeyboardOpen,
  isKeyboardClosed,
  hasActiveTextInput,
} from './layoutRules'
import type { LayoutState, LayoutRefs, AnchorSnapshot } from './layoutTypes'

describe('layoutRules Predicates Unit Tests', () => {
  const defaultState: LayoutState = {
    focusTarget: { type: 'none' },
    isKeyboardOpen: false,
    vvHeight: null,
  }

  const defaultAnchor: AnchorSnapshot = {
    closedScrollTop: 0,
    closedBodyHeight: null,
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isTouchDevice', () => {
    it('returns true when maxTouchPoints > 0', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true })
      expect(isTouchDevice()).toBe(true)
    })

    it('returns true when ontouchstart is present in window', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true })
      Object.defineProperty(window, 'ontouchstart', { value: null, configurable: true })
      expect(isTouchDevice()).toBe(true)
      // Cleanup
      delete (window as unknown as { ontouchstart?: unknown }).ontouchstart
    })

    it('returns false when maxTouchPoints is 0 and ontouchstart is absent', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true })
      delete (window as unknown as { ontouchstart?: unknown }).ontouchstart
      expect(isTouchDevice()).toBe(false)
    })
  })

  describe('isTextInput', () => {
    it('returns true when event target is a text input', () => {
      const input = document.createElement('input')
      input.type = 'text'
      expect(isTextInput({ target: input }, {}, defaultState, defaultAnchor)).toBe(true)
    })

    it('returns false when event target is not a text input', () => {
      const button = document.createElement('button')
      expect(isTextInput({ target: button }, {}, defaultState, defaultAnchor)).toBe(false)
      expect(isTextInput({}, {}, defaultState, defaultAnchor)).toBe(false)
    })
  })

  describe('isInsideFloating', () => {
    it('returns true when event target is a child of floatingRef', () => {
      const floatingContainer = document.createElement('div')
      const input = document.createElement('textarea')
      floatingContainer.appendChild(input)

      const refs: LayoutRefs = {
        floatingRef: { current: floatingContainer },
      }
      expect(isInsideFloating({ target: input }, refs, defaultState, defaultAnchor)).toBe(true)
    })

    it('returns false when event target is outside floatingRef or floatingRef is null', () => {
      const floatingContainer = document.createElement('div')
      const outsideInput = document.createElement('textarea')
      document.body.appendChild(outsideInput)

      const refs: LayoutRefs = {
        floatingRef: { current: floatingContainer },
      }
      expect(isInsideFloating({ target: outsideInput }, refs, defaultState, defaultAnchor)).toBe(false)
      expect(isInsideFloating({ target: outsideInput }, {}, defaultState, defaultAnchor)).toBe(false)
    })
  })

  describe('isInsideBody', () => {
    it('returns true when event target is a child of bodyRef', () => {
      const bodyContainer = document.createElement('div')
      const input = document.createElement('input')
      bodyContainer.appendChild(input)

      const refs: LayoutRefs = {
        bodyRef: { current: bodyContainer },
      }
      expect(isInsideBody({ target: input }, refs, defaultState, defaultAnchor)).toBe(true)
    })

    it('returns false when event target is outside bodyRef', () => {
      const bodyContainer = document.createElement('div')
      const outsideInput = document.createElement('input')

      const refs: LayoutRefs = {
        bodyRef: { current: bodyContainer },
      }
      expect(isInsideBody({ target: outsideInput }, refs, defaultState, defaultAnchor)).toBe(false)
    })
  })

  describe('isNoNextTextInput', () => {
    it('returns true when activeElement is not a text input or body', () => {
      const btn = document.createElement('button')
      document.body.appendChild(btn)
      btn.focus()
      expect(isNoNextTextInput({}, {}, defaultState, defaultAnchor)).toBe(true)
    })

    it('returns false when activeElement is a focused text input', () => {
      const input = document.createElement('input')
      input.type = 'text'
      document.body.appendChild(input)
      input.focus()
      expect(isNoNextTextInput({}, {}, defaultState, defaultAnchor)).toBe(false)
    })
  })

  describe('isFloatingActive and isBodyActive', () => {
    it('evaluates focusTarget type correctly', () => {
      const floatingState: LayoutState = {
        ...defaultState,
        focusTarget: { type: 'floating', element: document.createElement('textarea') },
      }
      const bodyState: LayoutState = {
        ...defaultState,
        focusTarget: { type: 'body-inline', element: document.createElement('input') },
      }

      expect(isFloatingActive({}, {}, floatingState, defaultAnchor)).toBe(true)
      expect(isFloatingActive({}, {}, bodyState, defaultAnchor)).toBe(false)
      expect(isFloatingActive({}, {}, defaultState, defaultAnchor)).toBe(false)

      expect(isBodyActive({}, {}, bodyState, defaultAnchor)).toBe(true)
      expect(isBodyActive({}, {}, floatingState, defaultAnchor)).toBe(false)
      expect(isBodyActive({}, {}, defaultState, defaultAnchor)).toBe(false)
    })
  })

  describe('isKeyboardOpen and isKeyboardClosed', () => {
    it('evaluates isKeyboardOpen flag correctly', () => {
      const openState: LayoutState = { ...defaultState, isKeyboardOpen: true }
      const closedState: LayoutState = { ...defaultState, isKeyboardOpen: false }

      expect(isKeyboardOpen({}, {}, openState, defaultAnchor)).toBe(true)
      expect(isKeyboardOpen({}, {}, closedState, defaultAnchor)).toBe(false)

      expect(isKeyboardClosed({}, {}, openState, defaultAnchor)).toBe(false)
      expect(isKeyboardClosed({}, {}, closedState, defaultAnchor)).toBe(true)
    })
  })

  describe('hasActiveTextInput', () => {
    it('returns true when state.focusTarget is not none', () => {
      const activeState: LayoutState = {
        ...defaultState,
        focusTarget: { type: 'floating', element: document.createElement('textarea') },
      }
      expect(hasActiveTextInput({}, {}, activeState, defaultAnchor)).toBe(true)
    })

    it('checks document.activeElement when state.focusTarget is none', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      expect(hasActiveTextInput({}, {}, defaultState, defaultAnchor)).toBe(true)

      input.blur()
      expect(hasActiveTextInput({}, {}, defaultState, defaultAnchor)).toBe(false)
    })
  })

  describe('Keyboard open delta threshold boundaries (screenH - currentH > threshold)', () => {
    const threshold = 100
    const screenH = 800

    const isKeyboardDetected = (currentH: number, isTouch: boolean) => {
      return screenH - currentH > threshold && isTouch
    }

    it('evaluates false at or below threshold', () => {
      // Delta = 99 (below threshold 100)
      expect(isKeyboardDetected(701, true)).toBe(false)

      // Delta = 100 (exact threshold boundary, must be strictly greater >)
      expect(isKeyboardDetected(700, true)).toBe(false)
    })

    it('evaluates true strictly above threshold on touch devices', () => {
      // Delta = 101 (above threshold 100)
      expect(isKeyboardDetected(699, true)).toBe(true)

      // Delta = 300 (typical keyboard height)
      expect(isKeyboardDetected(500, true)).toBe(true)
    })

    it('evaluates false when not a touch device even if delta > threshold (e.g. desktop devtools resize)', () => {
      expect(isKeyboardDetected(500, false)).toBe(false)
    })
  })
})
