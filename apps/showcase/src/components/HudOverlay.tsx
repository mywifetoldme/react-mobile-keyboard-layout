import { useState, useEffect, useRef } from 'react'
import { translations, type Language } from '../i18n'
import type { UseMobileKeyboardReturn } from 'react-mobile-keyboard-layout'

export interface RmklMetrics {
  transitionState: 'idle' | 'opening' | 'closing'
  isKeyboardOpen: boolean
  maxHeaderTopDeviation: number
  maxScrollYDeviation: number
  lastHeaderTop: number
  lastScrollY: number
  sampleCount: number
  reset: () => void
}

declare global {
  interface Window {
    __rmklMetrics?: RmklMetrics
  }
}

interface HudOverlayProps {
  engine: UseMobileKeyboardReturn
  lang: Language
}

export const HudOverlay = ({ engine, lang }: HudOverlayProps) => {
  const [scrollY, setScrollY] = useState(0)
  const [maxHeaderDev, setMaxHeaderDev] = useState(0)
  const [maxScrollDev, setMaxScrollDev] = useState(0)
  const [transitionState, setTransitionState] = useState<'idle' | 'opening' | 'closing'>('idle')
  const prevKeyboardOpenRef = useRef(engine.isKeyboardOpen)
  const t = translations[lang]

  const metricsRef = useRef<RmklMetrics>({
    transitionState: 'idle',
    isKeyboardOpen: engine.isKeyboardOpen,
    maxHeaderTopDeviation: 0,
    maxScrollYDeviation: 0,
    lastHeaderTop: 0,
    lastScrollY: 0,
    sampleCount: 0,
    reset: () => {
      metricsRef.current.maxHeaderTopDeviation = 0
      metricsRef.current.maxScrollYDeviation = 0
      metricsRef.current.sampleCount = 0
      setMaxHeaderDev(0)
      setMaxScrollDev(0)
    },
  })

  // Detect transition state
  useEffect(() => {
    if (prevKeyboardOpenRef.current !== engine.isKeyboardOpen) {
      const nextState = engine.isKeyboardOpen ? 'opening' : 'closing'
      setTransitionState(nextState)
      metricsRef.current.transitionState = nextState
      metricsRef.current.isKeyboardOpen = engine.isKeyboardOpen

      const timer = setTimeout(() => {
        setTransitionState('idle')
        metricsRef.current.transitionState = 'idle'
      }, 600)

      prevKeyboardOpenRef.current = engine.isKeyboardOpen
      return () => clearTimeout(timer)
    }
  }, [engine.isKeyboardOpen])

  // Continuous high-rate metric sampling during rendering & scrolling
  useEffect(() => {
    let animId: number

    const sample = () => {
      const currentScrollY = Math.round(window.scrollY * 10) / 10
      setScrollY(currentScrollY)

      const headerEl = document.querySelector('header')
      const headerTop = headerEl ? Math.abs(headerEl.getBoundingClientRect().top) : 0

      metricsRef.current.lastHeaderTop = headerTop
      metricsRef.current.lastScrollY = currentScrollY
      metricsRef.current.sampleCount += 1

      if (headerTop > metricsRef.current.maxHeaderTopDeviation) {
        metricsRef.current.maxHeaderTopDeviation = headerTop
        setMaxHeaderDev(headerTop)
      }

      if (Math.abs(currentScrollY) > metricsRef.current.maxScrollYDeviation) {
        metricsRef.current.maxScrollYDeviation = Math.abs(currentScrollY)
        setMaxScrollDev(Math.abs(currentScrollY))
      }

      animId = requestAnimationFrame(sample)
    }

    animId = requestAnimationFrame(sample)

    if (typeof window !== 'undefined') {
      window.__rmklMetrics = metricsRef.current
    }

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div
      data-testid="rmkl-hud"
      data-transition-state={transitionState}
      data-is-keyboard-open={engine.isKeyboardOpen}
      data-max-header-deviation={maxHeaderDev.toFixed(2)}
      data-max-scroll-deviation={maxScrollDev.toFixed(2)}
      data-window-scroll-y={scrollY.toFixed(1)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        padding: '12px',
        margin: '12px 16px',
        backgroundColor: 'rgba(39, 39, 42, 0.6)',
        border: '1px solid #3f3f46',
        borderRadius: '12px',
        fontSize: '12px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      }}
    >
      <div>
        <div style={{ color: '#a1a1aa', fontSize: '10px' }}>{t.hudVvHeight}</div>
        <div style={{ fontWeight: 600, color: '#60a5fa' }}>
          {typeof window !== 'undefined' && window.visualViewport ? `${Math.round(window.visualViewport.height)}px` : 'N/A'}
        </div>
      </div>
      <div>
        <div style={{ color: '#a1a1aa', fontSize: '10px' }}>{t.hudWindowScroll}</div>
        <div style={{ fontWeight: 600, color: scrollY === 0 ? '#4ade80' : '#f87171' }}>
          {scrollY.toFixed(1)}px {scrollY === 0 ? '✓ (0.0px)' : `⚠ (Max: ${maxScrollDev.toFixed(1)}px)`}
        </div>
      </div>
      <div>
        <div style={{ color: '#a1a1aa', fontSize: '10px' }}>{t.hudKeyboardState}</div>
        <div style={{ fontWeight: 600, color: engine.isKeyboardOpen ? '#facc15' : '#a1a1aa' }}>
          {engine.isKeyboardOpen ? t.keyboardOpen : t.keyboardClosed}
          {transitionState !== 'idle' && ` (${transitionState})`}
        </div>
      </div>
      <div>
        <div style={{ color: '#a1a1aa', fontSize: '10px' }}>{t.hudActiveInput}</div>
        <div style={{ fontWeight: 600, color: '#c084fc' }}>
          {engine.isFloatingSuppressed ? 'BODY' : engine.isKeyboardOpen ? 'FLOATING' : 'NONE'}
        </div>
      </div>
      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
          📐 Max Header Top Drift: <strong style={{ color: maxHeaderDev === 0 ? '#4ade80' : '#f87171' }}>{maxHeaderDev.toFixed(1)}px</strong>
        </div>
        <button
          type="button"
          onClick={() => metricsRef.current.reset()}
          style={{
            background: 'transparent',
            border: '1px solid #52525b',
            color: '#a1a1aa',
            fontSize: '10px',
            borderRadius: '4px',
            padding: '2px 6px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

