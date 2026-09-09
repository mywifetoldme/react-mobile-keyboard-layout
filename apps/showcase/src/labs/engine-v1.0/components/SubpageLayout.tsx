'use client'

import {
  forwardRef,
  useRef,
  type ReactNode,
  type HTMLAttributes,
  type ComponentPropsWithoutRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import { useMobileKeyboard, type UseMobileKeyboardReturn } from '../hooks/useMobileKeyboard'
import './SubpageLayout.css'

export interface SubpageLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  headerLeft?: ReactNode
  headerRight?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  bodyRef?: RefObject<HTMLDivElement | null>
  /** Share the caller's hook instance (e.g. to read isKeyboardOpen). Defaults to an internal one. */
  keyboardEngine?: UseMobileKeyboardReturn
  headerProps?: ComponentPropsWithoutRef<'header'>
  bodyProps?: ComponentPropsWithoutRef<'main'>
  footerProps?: ComponentPropsWithoutRef<'footer'>
}

export const SubpageLayout = forwardRef<HTMLDivElement, SubpageLayoutProps>(({
  title,
  headerLeft,
  headerRight,
  header,
  footer,
  children,
  bodyRef,
  className = '',
  style,
  keyboardEngine,
  headerProps,
  bodyProps,
  footerProps,
  ...rest
}, ref) => {
  // the hook needs the body element to keep a focused body input still; give it one even when the
  // caller did not pass a ref
  const ownBodyRef = useRef<HTMLDivElement | null>(null)
  const resolvedBodyRef = bodyRef ?? ownBodyRef
  const internalEngine = useMobileKeyboard({ bodyRef: resolvedBodyRef })
  const engine = keyboardEngine ?? internalEngine

  // The consumer's handler runs first and is never overwritten; it can opt out with preventDefault()
  const handleBodyPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    bodyProps?.onPointerDown?.(e)
    if (!e.defaultPrevented) engine.bodyProps.onPointerDown(e)
  }

  return (
    <div
      ref={ref}
      className={`rmkl-v10-subpage-root ${className}`.trim()}
      style={style}
      {...rest}
    >
      {/* 1. Header outside the resizing flow (position: absolute, see SubpageLayout.css) */}
      {header ? (
        <div className="rmkl-v10-subpage-header-slot">{header}</div>
      ) : (
        <header
          role="banner"
          {...headerProps}
          className={`rmkl-v10-subpage-header ${headerProps?.className ?? ''}`.trim()}
        >
          <div className="rmkl-v10-header-left">{headerLeft}</div>
          <h1 className="rmkl-v10-header-title">{title}</h1>
          <div className="rmkl-v10-header-right">{headerRight}</div>
        </header>
      )}

      {/* 2. Body: CSS reserves the keyboard height (--rmkl-v10-kb) and keeps the reading position (column-reverse) */}
      <div className="rmkl-v10-subpage-body-container">
        <main
          role="main"
          ref={resolvedBodyRef}
          {...bodyProps}
          onPointerDown={handleBodyPointerDown}
          className={`rmkl-v10-subpage-body ${bodyProps?.className ?? ''}`.trim()}
        >
          <div className="rmkl-v10-subpage-body-inner">{children}</div>
        </main>

        {footer && (
          <footer
            role="contentinfo"
            {...footerProps}
            className={`rmkl-v10-subpage-footer ${footerProps?.className ?? ''}`.trim()}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
})

SubpageLayout.displayName = 'SubpageLayout'
