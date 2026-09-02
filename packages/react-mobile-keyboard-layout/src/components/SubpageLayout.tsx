'use client'

import {
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type ComponentPropsWithoutRef,
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
  bodyRef?: React.RefObject<HTMLDivElement | null>
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
  keyboardEngine: externalEngine,
  headerProps,
  bodyProps,
  footerProps,
  ...rest
}, ref) => {
  const internalEngine = useMobileKeyboard({ bodyRef })
  const engine = externalEngine ?? internalEngine

  return (
    <div
      ref={ref}
      className={`rmkl-subpage-root ${className}`.trim()}
      style={style}
      {...rest}
    >
      {/* 1. Physically Isolated Header - Untouched by dynamic body resizing */}
      {header ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 60 }}>
          {header}
        </div>
      ) : (
        <header
          role="banner"
          {...headerProps}
          className={`rmkl-subpage-header ${headerProps?.className ?? ''}`.trim()}
          style={headerProps?.style}
        >
          <div className="rmkl-header-left">{headerLeft}</div>
          <h1 className="rmkl-header-title">{title}</h1>
          <div className="rmkl-header-right">{headerRight}</div>
        </header>
      )}

      {/* 2. Responsive Viewport Body Container */}
      <div
        className="rmkl-subpage-body-container"
        style={engine.containerStyle}
      >
        <main
          role="main"
          ref={bodyRef}
          {...bodyProps}
          {...engine.bodyProps}
          className={`rmkl-subpage-body ${bodyProps?.className ?? ''}`.trim()}
          style={{
            ...bodyProps?.style,
            ...engine.bodyProps?.style,
          }}
        >
          {children}
        </main>

        {footer && (
          <footer
            role="contentinfo"
            {...footerProps}
            className={`rmkl-subpage-footer ${footerProps?.className ?? ''}`.trim()}
            style={footerProps?.style}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
})

SubpageLayout.displayName = 'SubpageLayout'
