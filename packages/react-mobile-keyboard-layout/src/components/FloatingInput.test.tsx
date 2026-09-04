import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FloatingInput } from './FloatingInput'

describe('FloatingInput', () => {
  it('renders textarea with placeholder and handles text change', () => {
    const handleChange = vi.fn()
    const handleSubmit = vi.fn()

    render(
      <FloatingInput
        value=""
        onChange={handleChange}
        onSubmit={handleSubmit}
        placeholder="Type here..."
      />
    )

    const textarea = screen.getByPlaceholderText('Type here...') as HTMLTextAreaElement
    expect(textarea).toBeDefined()

    fireEvent.change(textarea, { target: { value: 'Hello' } })
    expect(handleChange).toHaveBeenCalledWith('Hello')
  })

  it('submits on button click and prevents blur with pointerdown preventDefault', () => {
    const handleSubmit = vi.fn()
    const handleChange = vi.fn()

    render(
      <FloatingInput
        value="Hello world"
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    )

    const sendBtn = screen.getByRole('button', { name: 'Send' })
    const event = new Event('pointerdown', { cancelable: true, bubbles: true })
    sendBtn.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)

    fireEvent.click(sendBtn)
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('textarea pointerdown is intercepted: preventDefault (no native window pan) and focus({ preventScroll: true })', () => {
    render(<FloatingInput value="" onChange={vi.fn()} onSubmit={vi.fn()} />)

    const textarea = screen.getByRole('textbox')
    const focusSpy = vi.spyOn(textarea, 'focus')
    const event = new Event('pointerdown', { cancelable: true, bubbles: true })
    textarea.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('applies 2-step suppression (visibility: hidden initially, display: none when keyboard open)', () => {
    // Step 1: Suppressed while keyboard not yet open (ghost state holding 60px slot)
    const { container, rerender } = render(
      <FloatingInput
        value="Hidden"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isSuppressed={true}
        isKeyboardOpen={false}
      />
    )
    expect((container.firstChild as HTMLElement).style.visibility).toBe('hidden')
    expect((container.firstChild as HTMLElement).style.display).not.toBe('none')

    // Step 2: Suppressed when keyboard opens (collapse to reclaim space)
    rerender(
      <FloatingInput
        value="Hidden"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isSuppressed={true}
        isKeyboardOpen={true}
      />
    )
    expect((container.firstChild as HTMLElement).style.display).toBe('none')
  })

  it('forwards slot props to textarea and send button', () => {
    render(
      <FloatingInput
        value="Custom"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        textareaProps={{
          className: 'custom-textarea',
          style: { fontSize: '18px' },
          id: 'test-textarea',
        }}
        buttonProps={{
          className: 'custom-btn',
          style: { backgroundColor: 'red' },
          id: 'test-send-btn',
        }}
      />
    )

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    const button = screen.getByRole('button')

    expect(textarea.className).toContain('custom-textarea')
    expect(textarea.style.fontSize).toBe('18px')
    expect(textarea.id).toBe('test-textarea')
    expect(button.className).toContain('custom-btn')
    expect(button.style.backgroundColor).toBe('red')
    expect(button.id).toBe('test-send-btn')
  })
})
