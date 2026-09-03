import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LayoutEngine } from './layoutEngine'

describe('Rule Priority & First-Match-Wins Precedence', () => {
  let bodyEl: HTMLDivElement
  let floatingEl: HTMLDivElement
  let floatingTextarea: HTMLTextAreaElement

  beforeEach(() => {
    vi.restoreAllMocks()
    window.scrollTo = vi.fn()

    // Nested structure: floating container is placed INSIDE body scroll container
    bodyEl = document.createElement('div')
    bodyEl.scrollTop = 140
    Object.defineProperty(bodyEl, 'clientHeight', { value: 600, configurable: true })

    floatingEl = document.createElement('div')
    floatingTextarea = document.createElement('textarea')
    floatingEl.appendChild(floatingTextarea)

    // Append floating inside body
    bodyEl.appendChild(floatingEl)
    document.body.appendChild(bodyEl)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('prioritizes isInsideFloating over isInsideBody when floating input is nested inside scroll container', () => {
    const engine = new LayoutEngine({
      refs: {
        bodyRef: { current: bodyEl },
        floatingRef: { current: floatingEl },
      },
    })

    // Both isInsideFloating and isInsideBody will be true
    engine.dispatch('focusin', { target: floatingTextarea })

    // Must be 'floating' (first-match-wins), NOT overwritten by body-inline
    expect(engine.getState().focusTarget.type).toBe('floating')
    expect(engine.getAnchor().closedScrollTop).toBe(140)
  })
})
