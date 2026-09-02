import { isKeyboardTextInput } from '../utils/isKeyboardTextInput'
import type {
  LayoutRule,
  ConditionPredicate,
} from './layoutTypes'

/* ==========================================================================
   Pure Predicates (Composable AND Conditions)
   ========================================================================== */

export const isTouchDevice = (): boolean => {
  return (
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)
  )
}

/** Check if the event target is a virtual software keyboard text input */
export const isTextInput: ConditionPredicate = (event) => {
  const e = event as { target?: unknown }
  return isKeyboardTextInput(e?.target)
}

/** Check if the event target is inside the floating input reference */
export const isInsideFloating: ConditionPredicate = (event, refs) => {
  const e = event as { target?: unknown }
  const target = e?.target as Node | null
  const floatingEl = refs.floatingRef?.current
  return Boolean(target && floatingEl && floatingEl.contains(target))
}

/** Check if the event target is inside the body container reference */
export const isInsideBody: ConditionPredicate = (event, refs) => {
  const e = event as { target?: unknown }
  const target = e?.target as Node | null
  const bodyEl = refs.bodyRef?.current
  return Boolean(target && bodyEl && bodyEl.contains(target))
}

/** Check if the next activeElement in the document is NOT a text input (loss of focus) */
export const isNoNextTextInput: ConditionPredicate = () => {
  if (typeof document === 'undefined') return true
  return !isKeyboardTextInput(document.activeElement)
}

/** Check if currently typing in floating input */
export const isFloatingActive: ConditionPredicate = (_, __, state) => {
  return state.focusTarget.type === 'floating'
}

/** Check if currently typing in body inline input */
export const isBodyActive: ConditionPredicate = (_, __, state) => {
  return state.focusTarget.type === 'body-inline'
}

/** Check if the virtual keyboard is open */
export const isKeyboardOpen: ConditionPredicate = (_, __, state) => {
  return state.isKeyboardOpen
}

/** Check if the virtual keyboard is closed */
export const isKeyboardClosed: ConditionPredicate = (_, __, state) => {
  return !state.isKeyboardOpen
}

/** Check if there is an active text input holding focus */
export const hasActiveTextInput: ConditionPredicate = (_, __, state) => {
  if (state.focusTarget.type !== 'none') return true
  if (typeof document === 'undefined') return false
  return isKeyboardTextInput(document.activeElement)
}

/* ==========================================================================
   Pure Coordinate Preservation Formula
   Delta_H = H_closed - H_current
   S_new = S_0 + Delta_H
   ========================================================================== */

export const calculatePreservedScrollTop = (
  closedHeight: number | null,
  currHeight: number,
  closedScrollTop: number,
): number | null => {
  if (closedHeight !== null && closedHeight > currHeight) {
    const deltaH = closedHeight - currHeight
    return closedScrollTop + deltaH
  }
  return null
}

/* ==========================================================================
   Declarative Reference-Driven Layout Rules (FSM Transition Matrix)
   ========================================================================== */

export const createDefaultLayoutRules = (keyboardThreshold = 100): LayoutRule<unknown>[] => [
  /* --------------------------------------------------------------------------
     1. focusin: Floating Input Focused
     -------------------------------------------------------------------------- */
  {
    on: 'focusin',
    when: [isTextInput, isInsideFloating],
    apply: (e, ctx) => {
      const ev = e as FocusEvent
      ctx.captureBaselineAnchor()
      ctx.lockWindowTop()
      return {
        focusTarget: { type: 'floating', element: ev.target as HTMLElement },
      }
    },
  },

  /* --------------------------------------------------------------------------
     2. focusin: Body Inline Form Input Focused
     -------------------------------------------------------------------------- */
  {
    on: 'focusin',
    when: [isTextInput, isInsideBody],
    apply: (e, ctx) => {
      const ev = e as FocusEvent
      ctx.lockWindowTop()
      return {
        focusTarget: { type: 'body-inline', element: ev.target as HTMLElement },
      }
    },
  },

  /* --------------------------------------------------------------------------
     3. focusout: Global Focus Out (Loss of Virtual Keyboard Focus)
     -------------------------------------------------------------------------- */
  {
    on: 'focusout',
    when: [isTextInput, isNoNextTextInput],
    apply: (_, ctx) => {
      const wasFloating = ctx.state.focusTarget.type === 'floating'
      ctx.lockWindowTop()
      if (wasFloating) {
        ctx.restoreBaselineScroll()
      }
      return {
        focusTarget: { type: 'none' },
        isKeyboardOpen: false,
        vvHeight: null,
      }
    },
  },

  /* --------------------------------------------------------------------------
     4. visualViewport.resize: Viewport Geometry Contraction / Expansion
     -------------------------------------------------------------------------- */
  {
    on: 'visualViewport.resize',
    when: [hasActiveTextInput],
    apply: (_, ctx) => {
      if (typeof window === 'undefined' || !window.visualViewport) return
      const vv = window.visualViewport
      const currentH = vv.height
      const screenH = window.innerHeight || currentH
      const open = screenH - currentH > keyboardThreshold && isTouchDevice()

      ctx.lockWindowTop()
      if (open && !ctx.state.isKeyboardOpen) {
        if (ctx.state.focusTarget.type === 'floating') {
          ctx.captureBaselineAnchor()
        } else if (ctx.state.focusTarget.type === 'body-inline') {
          const target = ctx.state.focusTarget.element
          const bodyEl = ctx.refs.bodyRef?.current
          if (target && bodyEl) {
            const mainRect = bodyEl.getBoundingClientRect()
            const inputRect = target.getBoundingClientRect()
            const diff = inputRect.top - mainRect.top - 16
            if (Math.abs(diff) > 2) {
              if (typeof bodyEl.scrollTo === 'function') {
                bodyEl.scrollTo({ top: bodyEl.scrollTop + diff, behavior: 'smooth' })
              } else {
                bodyEl.scrollTop += diff
              }
            }
          }
        }
      }

      return {
        vvHeight: currentH,
        isKeyboardOpen: open,
      }
    },
  },

  /* --------------------------------------------------------------------------
     5. resize: Body ResizeObserver while typing in Floating Input
     -------------------------------------------------------------------------- */
  {
    on: 'resize',
    when: [isFloatingActive, isKeyboardOpen],
    apply: (entry, ctx) => {
      const roEntry = entry as ResizeObserverEntry
      const currHeight = roEntry.contentRect?.height ?? 0
      if (currHeight > 0) {
        ctx.applyScrollOffset(currHeight)
      }
    },
  },

  /* --------------------------------------------------------------------------
     6. resize: Body ResizeObserver while Keyboard is Closed
     -------------------------------------------------------------------------- */
  {
    on: 'resize',
    when: [isKeyboardClosed],
    apply: (entry, ctx) => {
      const roEntry = entry as ResizeObserverEntry
      const currHeight = roEntry.contentRect?.height ?? 0
      if (currHeight > 0) {
        ctx.updateClosedHeight(currHeight)
      }
    },
  },

  /* --------------------------------------------------------------------------
     7. scroll: Body Scrolling while Keyboard is Closed (Sync Baseline S_0)
     -------------------------------------------------------------------------- */
  {
    on: 'scroll',
    when: [isKeyboardClosed],
    apply: (_, ctx) => {
      const el = ctx.refs.bodyRef?.current
      if (el) {
        ctx.updateClosedScrollTop(el.scrollTop)
        ctx.updateClosedHeight(el.clientHeight)
      }
    },
  },

  /* --------------------------------------------------------------------------
     8. pointerdown: Body Input Tap Interception
     -------------------------------------------------------------------------- */
  {
    on: 'pointerdown',
    when: [isTextInput],
    apply: (e, ctx) => {
      if (typeof (e as Event).stopPropagation === 'function') {
        (e as Event).stopPropagation()
      }
      ctx.lockWindowTop()
      const target = (e as { target?: unknown }).target as HTMLElement | null
      target?.focus({ preventScroll: true })
    },
  },
]
