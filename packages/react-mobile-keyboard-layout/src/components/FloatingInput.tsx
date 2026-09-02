'use client'

import {
  useRef,
  useEffect,
  type KeyboardEvent,
  type ReactNode,
  type ChangeEvent,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import './FloatingInput.css'

export interface FloatingInputProps {
  /** Text value of the input */
  value: string
  /** Callback fired on text value change */
  onChange: (value: string) => void
  /** Callback fired on submit (Enter or send button tap) */
  onSubmit: () => void
  /** Placeholder text for textarea */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Whether the floating input is temporarily suppressed by the keyboard engine */
  isSuppressed?: boolean
  /** Whether the virtual keyboard is currently open */
  isKeyboardOpen?: boolean
  /** Maximum height in pixels for the auto-growing textarea. Default: 120 */
  maxHeight?: number
  /** Focus handler forwarded from keyboardEngine.floatingProps */
  onFocus?: () => void
  /** Blur handler forwarded from keyboardEngine.floatingProps */
  onBlur?: () => void
  /** PointerDown handler forwarded from keyboardEngine.floatingProps */
  onPointerDown?: (e: ReactPointerEvent<HTMLElement> | PointerEvent) => void
  /** Class name for outer wrapper */
  className?: string
  /** Style object for outer wrapper */
  style?: CSSProperties
  /** Slot props forwarded directly to the inner <textarea> */
  textareaProps?: ComponentPropsWithoutRef<'textarea'>
  /** Slot props forwarded directly to the inner submit <button> */
  buttonProps?: ComponentPropsWithoutRef<'button'> & {
    icon?: ReactNode
  }
}

export const FloatingInput = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Write a message...',
  disabled = false,
  isSuppressed = false,
  isKeyboardOpen = false,
  maxHeight = 120,
  onFocus,
  onBlur,
  onPointerDown,
  className = '',
  style,
  textareaProps,
  buttonProps,
}: FloatingInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const isComposingRef = useRef(false)

  // Auto-grow textarea height up to maxHeight
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [value, maxHeight])

  const canSubmit = Boolean(value.trim()) && !disabled

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    textareaProps?.onKeyDown?.(e)
    if (e.defaultPrevented) return

    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposingRef.current || e.nativeEvent.isComposing) {
        return
      }
      e.preventDefault()
      if (canSubmit) {
        onSubmit()
      }
    }
  }

  const { icon: customIcon, className: buttonClassName = '', style: buttonStyle, ...restButtonProps } = buttonProps ?? {}
  const { className: textareaClassName = '', style: textareaStyle, ...restTextareaProps } = textareaProps ?? {}

  const suppressedStyle: CSSProperties = isSuppressed
    ? isKeyboardOpen
      ? { display: 'none' }
      : { visibility: 'hidden', pointerEvents: 'none' }
    : {}

  return (
    <div
      role="region"
      aria-label="Floating input bar"
      className={`rmkl-floating-input-wrapper${isKeyboardOpen ? ' rmkl-floating-input-wrapper--keyboard-open' : ''}${isSuppressed ? ' rmkl-floating-input-wrapper--suppressed' : ''} ${className}`.trim()}
      style={{
        ...style,
        ...suppressedStyle,
      }}
    >
      <div className="rmkl-floating-input-bar">
        <textarea
          ref={textareaRef}
          rows={1}
          maxLength={2000}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={placeholder}
          {...restTextareaProps}
          className={`rmkl-floating-input-textarea ${textareaClassName}`.trim()}
          style={textareaStyle}
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            restTextareaProps.onChange?.(e)
            onChange(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onCompositionStart={(e) => {
            restTextareaProps.onCompositionStart?.(e)
            isComposingRef.current = true
          }}
          onCompositionEnd={(e) => {
            restTextareaProps.onCompositionEnd?.(e)
            isComposingRef.current = false
          }}
          onPointerDown={(e) => {
            restTextareaProps.onPointerDown?.(e)
            onPointerDown?.(e)
            // Prevent Safari's native window pan scroll and focus with preventScroll: true
            e.preventDefault()
            textareaRef.current?.focus({ preventScroll: true })
          }}
          onFocus={(e) => {
            restTextareaProps.onFocus?.(e)
            onFocus?.()
          }}
          onBlur={(e) => {
            restTextareaProps.onBlur?.(e)
            onBlur?.()
          }}
        />
        <button
          type="button"
          aria-label="Send"
          disabled={!canSubmit}
          {...restButtonProps}
          className={`rmkl-floating-input-send${canSubmit ? ' rmkl-floating-input-send--active' : ''} ${buttonClassName}`.trim()}
          style={buttonStyle}
          onClick={(e) => {
            restButtonProps.onClick?.(e)
            onSubmit()
          }}
          onPointerDown={(e) => {
            restButtonProps.onPointerDown?.(e)
            // Prevent pointerdown from blurring the textarea, preserving virtual keyboard focus
            e.preventDefault()
          }}
        >
          {customIcon ? (
            customIcon
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
