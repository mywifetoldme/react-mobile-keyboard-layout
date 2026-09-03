import type { RefObject, CSSProperties, PointerEvent as ReactPointerEvent } from 'react'

export type FocusTarget =
  | { type: 'none' }
  | { type: 'floating'; element: HTMLElement }
  | { type: 'body-inline'; element: HTMLElement }

export interface LayoutState {
  /** Target element reference currently holding keyboard focus */
  focusTarget: FocusTarget
  /** Whether the virtual software keyboard is currently active */
  isKeyboardOpen: boolean
  /** Measured visualViewport height in pixels (null when keyboard is closed) */
  vvHeight: number | null
}

export interface AnchorSnapshot {
  /** Baseline scroll top offset when keyboard was closed (S_0) */
  closedScrollTop: number
  /** Baseline client height when keyboard was closed (H_0) */
  closedBodyHeight: number | null
}

export interface LayoutRefs {
  bodyRef?: RefObject<HTMLElement | null>
  floatingRef?: RefObject<HTMLElement | null>
}

export type EngineEventType =
  | 'focusin'
  | 'focusout'
  | 'resize'
  | 'visualViewport.resize'
  | 'visualViewport.scroll'
  | 'scroll'
  | 'pointerdown'

export type ConditionPredicate<TEvent = unknown> = (
  event: TEvent,
  refs: LayoutRefs,
  state: LayoutState,
  anchor: AnchorSnapshot,
) => boolean

export interface LayoutContext {
  state: LayoutState
  anchor: AnchorSnapshot
  refs: LayoutRefs
  lockWindowTop: (durationMs?: number) => void
  captureBaselineAnchor: () => void
  restoreBaselineScroll: () => void
  applyScrollOffset: (currHeight: number) => void
  updateClosedScrollTop: (st: number) => void
  updateClosedHeight: (h: number) => void
  /**
   * Temporarily suppresses incoming browser `scroll` event baseline synchronization
   * during smooth / programmatic scroll execution, preventing animation frames from corrupting S_0.
   */
  ignoreScrollEventsFor: (durationMs: number, action?: () => void) => void
  setState: (partial: Partial<LayoutState>) => void
}

export interface LayoutRule<TEvent = unknown> {
  on: EngineEventType
  when: ConditionPredicate<TEvent>[]
  apply: (event: TEvent, ctx: LayoutContext) => Partial<LayoutState> | void
}

export interface UseMobileKeyboardOptions {
  /** Ref to the scrollable content container */
  bodyRef?: RefObject<HTMLElement | null>
  /** Threshold in pixels to treat viewport height contraction as keyboard opening. Default: 100 */
  keyboardThreshold?: number
  /** Padding in pixels for in-body input boundary safe-zone alignment. Default: 16 */
  alignPadding?: number
  /** Duration in milliseconds for continuous rAF top-lock loop. Default: 350 */
  lockDurationMs?: number
  /** Whether to prevent rubber-banding on non-scrollable background areas. Default: false */
  preventOuterScroll?: boolean
  /** Custom rules array to override or extend default layout rules */
  rules?: LayoutRule<unknown>[]
}

export interface UseMobileKeyboardReturn {
  /** Dynamic container styles locking height to window.visualViewport.height */
  containerStyle: CSSProperties
  /** Whether the virtual keyboard is currently open */
  isKeyboardOpen: boolean
  /** Whether floating input should be hidden/suppressed due to body input focus */
  isFloatingSuppressed: boolean
  /** Grouped props to spread onto the floating input component */
  floatingProps: {
    onFocus: () => void
    onBlur: () => void
    onPointerDown: (e: ReactPointerEvent<HTMLElement> | PointerEvent) => void
  }
  /** Grouped props to spread onto the scrollable body container */
  bodyProps: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement> | PointerEvent) => void
  }
  /** Smoothly scroll feed to bottom and sync baseline closed anchor */
  scrollToBottom: (behavior?: ScrollBehavior) => void
}
