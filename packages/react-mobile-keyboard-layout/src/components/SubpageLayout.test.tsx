import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SubpageLayout } from './SubpageLayout'

describe('SubpageLayout', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.scrollTo = vi.fn()
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
})
