import type {
  LayoutState,
  AnchorSnapshot,
  LayoutRefs,
  LayoutRule,
  LayoutContext,
  EngineEventType,
} from './layoutTypes'
import { calculatePreservedScrollTop, createDefaultLayoutRules } from './layoutRules'

export interface LayoutEngineOptions {
  refs?: LayoutRefs
  rules?: LayoutRule<unknown>[]
  keyboardThreshold?: number
  lockDurationMs?: number
  onStateChange?: (state: LayoutState) => void
}

export class LayoutEngine {
  private state: LayoutState = {
    focusTarget: { type: 'none' },
    isKeyboardOpen: false,
    vvHeight: typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : null,
  }

  private anchor: AnchorSnapshot = {
    closedScrollTop: 0,
    closedBodyHeight: null,
  }

  private refs: LayoutRefs = {}
  private rules: LayoutRule<unknown>[]
  private lockDurationMs: number
  private onStateChange?: (state: LayoutState) => void

  private animationFrameId: number | null = null
  private lockLoopStartTime = 0
  private isProgrammaticScroll = false
  private programmaticScrollTimer: ReturnType<typeof setTimeout> | null = null
  private scrollEndCleanup: (() => void) | null = null

  constructor(options: LayoutEngineOptions = {}) {
    this.refs = options.refs ?? {}
    this.rules = options.rules ?? createDefaultLayoutRules(options.keyboardThreshold ?? 100)
    this.lockDurationMs = options.lockDurationMs ?? 350
    this.onStateChange = options.onStateChange
  }

  public setRefs(refs: LayoutRefs) {
    this.refs = refs
  }

  public getState(): Readonly<LayoutState> {
    return this.state
  }

  public getAnchor(): Readonly<AnchorSnapshot> {
    return this.anchor
  }

  public setState(partial: Partial<LayoutState>) {
    this.state = { ...this.state, ...partial }
    this.onStateChange?.(this.state)
  }

  /**
   * 120Hz continuous window top-lock loop (clamps window.scrollY = 0)
   */
  public lockWindowTop = (duration = this.lockDurationMs) => {
    if (typeof window === 'undefined') return
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }
    this.lockLoopStartTime = performance.now()

    const step = (now: number) => {
      if (
        window.scrollY !== 0 ||
        document.documentElement.scrollTop !== 0 ||
        document.body.scrollTop !== 0
      ) {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }
      if (now - this.lockLoopStartTime < duration) {
        this.animationFrameId = requestAnimationFrame(step)
      } else {
        this.animationFrameId = null
      }
    }
    this.animationFrameId = requestAnimationFrame(step)
  }

  public captureBaselineAnchor = () => {
    const el = this.refs.bodyRef?.current
    if (el) {
      this.anchor.closedScrollTop = el.scrollTop
      this.anchor.closedBodyHeight = el.clientHeight
    }
  }

  public restoreBaselineScroll = () => {
    const el = this.refs.bodyRef?.current
    if (el) {
      el.scrollTop = this.anchor.closedScrollTop
    }
  }

  /**
   * Temporarily suppresses incoming browser `scroll` event baseline synchronization
   * while executing a programmatic / smooth scrolling action.
   *
   * **Problem Scenario**:
   * When calling `scrollTo({ behavior: 'smooth' })` or aligning elements, browsers emit dozens
   * of asynchronous `scroll` events across multiple animation frames throughout the 300–400ms duration.
   * If unsuppressed, `updateClosedScrollTop` would misinterpret these intermediate animation frames
   * as real user touch scrolls and overwrite the baseline anchor (`closedScrollTop` / S_0),
   * which breaks 0.0px zero-shift scroll restoration when the keyboard is dismissed.
   *
   * **Lifecycle & Safety**:
   * 1. Sets `isProgrammaticScroll = true` to guard baseline snapshots.
   * 2. Automatically releases the lock when the native browser `scrollend` event fires,
   *    with a `durationMs` (default: 350ms) timeout fallback for browsers without `scrollend`.
   * 3. Executes the optional `action` callback immediately under the protection of the guard.
   */
  public ignoreScrollEventsFor = (durationMs = 350, action?: () => void) => {
    if (this.programmaticScrollTimer !== null) {
      clearTimeout(this.programmaticScrollTimer)
      this.programmaticScrollTimer = null
    }
    if (this.scrollEndCleanup) {
      this.scrollEndCleanup()
      this.scrollEndCleanup = null
    }

    this.isProgrammaticScroll = true

    const bodyEl = this.refs.bodyRef?.current

    const cleanup = () => {
      this.isProgrammaticScroll = false
      if (this.programmaticScrollTimer !== null) {
        clearTimeout(this.programmaticScrollTimer)
        this.programmaticScrollTimer = null
      }
      if (this.scrollEndCleanup) {
        this.scrollEndCleanup()
        this.scrollEndCleanup = null
      }
    }

    if (bodyEl && typeof window !== 'undefined' && 'onscrollend' in window) {
      const handleScrollEnd = () => cleanup()
      bodyEl.addEventListener('scrollend', handleScrollEnd, { once: true })
      this.scrollEndCleanup = () => bodyEl.removeEventListener('scrollend', handleScrollEnd)
    }

    // Timeout fallback for browsers without scrollend or smooth animation durations
    this.programmaticScrollTimer = setTimeout(cleanup, durationMs)

    action?.()
  }

  public applyScrollOffset = (currHeight: number) => {
    const el = this.refs.bodyRef?.current
    if (!el) return
    const targetScrollTop = calculatePreservedScrollTop(
      this.anchor.closedBodyHeight,
      currHeight,
      this.anchor.closedScrollTop,
    )
    if (targetScrollTop !== null) {
      this.ignoreScrollEventsFor(100, () => {
        el.scrollTop = targetScrollTop
      })
    }
  }

  public updateClosedScrollTop = (st: number) => {
    if (this.isProgrammaticScroll) return
    this.anchor.closedScrollTop = st
  }

  public updateClosedHeight = (h: number) => {
    this.anchor.closedBodyHeight = h
  }

  public scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = this.refs.bodyRef?.current
    if (!el) return
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
    const closedHeight = this.anchor.closedBodyHeight ?? el.clientHeight
    this.anchor.closedScrollTop = Math.max(0, el.scrollHeight - closedHeight)
    this.ignoreScrollEventsFor(behavior === 'smooth' ? 400 : 100, () => {
      el.scrollTo({ top: maxScroll, behavior })
    })
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    if (this.programmaticScrollTimer !== null) {
      clearTimeout(this.programmaticScrollTimer)
      this.programmaticScrollTimer = null
    }
    if (this.scrollEndCleanup) {
      this.scrollEndCleanup()
      this.scrollEndCleanup = null
    }
  }

  /**
   * Dispatches a native browser or DOM event into the declarative rule matrix
   * Executes with first-match-wins precedence so specific rules take priority.
   */
  public dispatch = (on: EngineEventType, event: unknown) => {
    const ctx: LayoutContext = {
      state: this.state,
      anchor: this.anchor,
      refs: this.refs,
      lockWindowTop: this.lockWindowTop,
      captureBaselineAnchor: this.captureBaselineAnchor,
      restoreBaselineScroll: this.restoreBaselineScroll,
      applyScrollOffset: this.applyScrollOffset,
      updateClosedScrollTop: this.updateClosedScrollTop,
      updateClosedHeight: this.updateClosedHeight,
      ignoreScrollEventsFor: this.ignoreScrollEventsFor,
      setState: (p) => this.setState(p),
    }

    for (const rule of this.rules) {
      if (rule.on !== on) continue

      const matches = rule.when.every((predicate) =>
        predicate(event, this.refs, this.state, this.anchor),
      )

      if (matches) {
        const nextPartial = rule.apply(event, ctx)
        if (nextPartial && typeof nextPartial === 'object') {
          this.setState(nextPartial)
        }
        break // First-match-wins
      }
    }
  }
}
