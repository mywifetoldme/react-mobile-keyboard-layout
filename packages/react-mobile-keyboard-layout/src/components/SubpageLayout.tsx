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
      className={`rmkl-subpage-root ${className}`.trim()}
      style={style}
      {...rest}
    >
      {/* 1. Header outside the resizing flow (position: absolute, see SubpageLayout.css) */}
      {header ? (
        <div className="rmkl-subpage-header-slot">{header}</div>
      ) : (
        <header
          role="banner"
          {...headerProps}
          className={`rmkl-subpage-header ${headerProps?.className ?? ''}`.trim()}
        >
          <div className="rmkl-header-left">{headerLeft}</div>
          <h1 className="rmkl-header-title">{title}</h1>
          <div className="rmkl-header-right">{headerRight}</div>
        </header>
      )}

      {/* 2. Body: CSS reserves the keyboard height (--rmkl-kb) and keeps the reading position (column-reverse) */}
      <div className="rmkl-subpage-body-container">
        <main
          role="main"
          ref={resolvedBodyRef}
          {...bodyProps}
          onPointerDown={handleBodyPointerDown}
          className={`rmkl-subpage-body ${bodyProps?.className ?? ''}`.trim()}
        >
          <div className="rmkl-subpage-body-inner">{children}</div>
        </main>

        {footer && (
          <footer
            role="contentinfo"
            {...footerProps}
            className={`rmkl-subpage-footer ${footerProps?.className ?? ''}`.trim()}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
})

SubpageLayout.displayName = 'SubpageLayout'
