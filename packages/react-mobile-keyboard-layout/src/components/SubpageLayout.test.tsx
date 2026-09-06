import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SubpageLayout } from './SubpageLayout'
import css from './SubpageLayout.css?raw'

// Keyboard state is decided by these selectors. They are asserted to exist verbatim in
// SubpageLayout.css, so this test cannot drift away from the stylesheet.
const CLOSED = '.rmkl-subpage-root:not(:focus-within)'
const PICKER_FOCUSED =
  '.rmkl-subpage-root:has(:is(input[type="date"], input[type="time"], input[type="datetime-local"], input[type="month"], input[type="week"], select):focus)'
// the body-text branch is a list of four :has() selectors, one per kind of keyboard text input
const BODY_TEXT_FOCUSED = [
  '.rmkl-subpage-root:has(.rmkl-subpage-body textarea:focus)',
  '.rmkl-subpage-root:has(.rmkl-subpage-body [contenteditable]:not([contenteditable="false"]):focus)',
  '.rmkl-subpage-root:has(.rmkl-subpage-body input:not([type]):focus)',
  '.rmkl-subpage-root:has(.rmkl-subpage-body input:is([type="text"], [type="search"], [type="url"], [type="tel"], [type="email"], [type="password"], [type="number"]):focus)',
]
const matchesBodyText = (root: Element) => BODY_TEXT_FOCUSED.some((selector) => root.matches(selector))

describe('SubpageLayout', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.scrollTo = vi.fn()
    window.requestAnimationFrame = vi.fn(() => 1)
    window.cancelAnimationFrame = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders title and children cleanly', () => {
    render(
      <SubpageLayout title="Test Subpage">
        <div data-testid="content">Hello Subpage</div>
      </SubpageLayout>
    )

    expect(screen.getByText('Test Subpage')).toBeDefined()
    expect(screen.getByTestId('content')).toBeDefined()
  })

  it('renders footer when provided', () => {
    render(
      <SubpageLayout
        title="Footer Test"
        footer={<div data-testid="test-footer">Footer Action</div>}
      >
        <div>Content</div>
      </SubpageLayout>
    )

    expect(screen.getByTestId('test-footer')).toBeDefined()
  })

  it('forwards slot props to body, header, and footer', () => {
    render(
      <SubpageLayout
        title="Custom Slots"
        headerProps={{ className: 'custom-header', style: { borderBottomColor: 'blue' } }}
        bodyProps={{ className: 'custom-body', style: { padding: '24px' } }}
        footer={<div data-testid="footer-content">Footer</div>}
        footerProps={{ className: 'custom-footer', style: { backgroundColor: 'green' } }}
      >
        <div>Content</div>
      </SubpageLayout>
    )

    const header = screen.getByRole('banner')
    const main = screen.getByRole('main')
    const footer = screen.getByRole('contentinfo')

    expect(header.className).toContain('custom-header')
    expect(header.style.borderBottomColor).toBe('blue')
    expect(main.className).toContain('custom-body')
    expect(main.style.padding).toBe('24px')
    expect(footer.className).toContain('custom-footer')
    expect(footer.style.backgroundColor).toBe('green')
  })

  it('decides keyboard state with :focus-within / :has() by where the focus is: floating bar, body text input, native picker', () => {
    const { container } = render(
      <SubpageLayout
        title="Selector state"
        footer={
          <div className="rmkl-floating-input-wrapper">
            <textarea data-testid="floating" />
          </div>
        }
      >
        <input data-testid="body-text" type="text" />
        <input data-testid="picker" type="date" />
      </SubpageLayout>
    )
    const root = container.querySelector('.rmkl-subpage-root') as HTMLElement

    // the selectors under test are the ones the stylesheet actually uses
    for (const selector of [CLOSED, PICKER_FOCUSED, ...BODY_TEXT_FOCUSED]) {
      expect(css).toContain(selector)
    }

    // nothing focused → closed
    expect(root.matches(CLOSED)).toBe(true)

    // body text input → keyboard + body branch (floating bar gets suppressed)
    screen.getByTestId('body-text').focus()
    expect(root.matches(':focus-within')).toBe(true)
    expect(matchesBodyText(root)).toBe(true)
    expect(root.matches(PICKER_FOCUSED)).toBe(false)

    // native picker → excluded from the keyboard branches
    screen.getByTestId('picker').focus()
    expect(root.matches(PICKER_FOCUSED)).toBe(true)
    expect(matchesBodyText(root)).toBe(false)

    // floating bar → keyboard, but not the body branch
    screen.getByTestId('floating').focus()
    expect(root.matches(':focus-within')).toBe(true)
    expect(matchesBodyText(root)).toBe(false)
    expect(root.matches(PICKER_FOCUSED)).toBe(false)

    // blur → closed again, synchronously (no visualViewport.resize needed)
    ;(document.activeElement as HTMLElement).blur()
    expect(root.matches(CLOSED)).toBe(true)
  })

  it('keeps children in DOM order inside a column-reverse body (reading position is kept by CSS, not by JS)', () => {
    render(
      <SubpageLayout title="Order">
        <p data-testid="first">first</p>
        <p data-testid="second">second</p>
      </SubpageLayout>
    )
    const main = screen.getByRole('main')
    const inner = main.firstElementChild as HTMLElement

    expect(main.className).toContain('rmkl-subpage-body')
    expect(inner.className).toContain('rmkl-subpage-body-inner')
    expect(Array.from(inner.children).map((el) => el.textContent)).toEqual(['first', 'second'])
    expect(css).toMatch(/\.rmkl-subpage-body\s*\{[^}]*flex-direction:\s*column-reverse/)
  })

  it('runs the consumer bodyProps.onPointerDown first and then the tap interception (focus with preventScroll)', () => {
    const consumerHandler = vi.fn()
    render(
      <SubpageLayout title="Handlers" bodyProps={{ onPointerDown: consumerHandler }}>
        <input data-testid="body-text" type="text" />
      </SubpageLayout>
    )
    const input = screen.getByTestId('body-text') as HTMLInputElement
    const focusSpy = vi.spyOn(input, 'focus')

    fireEvent.pointerDown(input)

    expect(consumerHandler).toHaveBeenCalledTimes(1)
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
  })
})
