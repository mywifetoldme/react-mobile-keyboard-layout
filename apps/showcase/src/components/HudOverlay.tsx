import { useState, useEffect } from 'react'
import { translations, type Language } from '../i18n'
import type { UseMobileKeyboardReturn } from 'react-mobile-keyboard-layout'

interface HudOverlayProps {
  engine: UseMobileKeyboardReturn
  lang: Language
}

export const HudOverlay = ({ engine, lang }: HudOverlayProps) => {
  const [scrollY, setScrollY] = useState(0)
  const t = translations[lang]

  useEffect(() => {
    const updateScroll = () => {
      setScrollY(Math.round(window.scrollY * 10) / 10)
    }
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    const interval = setInterval(updateScroll, 100)
    return () => {
      window.removeEventListener('scroll', updateScroll)
      clearInterval(interval)
    }
  }, [])

  return (
    <div style={{
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
    }}>
      <div>
        <div style={{ color: '#a1a1aa', fontSize: '10px' }}>{t.hudVvHeight}</div>
        <div style={{ fontWeight: 600, color: '#60a5fa' }}>
          {typeof window !== 'undefined' && window.visualViewport ? `${Math.round(window.visualViewport.height)}px` : 'N/A'}
        </div>
      </div>
      <div>
        <div style={{ color: '#a1a1aa', fontSize: '10px' }}>{t.hudWindowScroll}</div>
        <div style={{ fontWeight: 600, color: scrollY === 0 ? '#4ade80' : '#f87171' }}>
          {scrollY.toFixed(1)}px {scrollY === 0 ? '✓ (Locked)' : '⚠ (Drift)'}
        </div>
      </div>
      <div>
        <div style={{ color: '#a1a1aa', fontSize: '10px' }}>{t.hudKeyboardState}</div>
        <div style={{ fontWeight: 600, color: engine.isKeyboardOpen ? '#facc15' : '#a1a1aa' }}>
          {engine.isKeyboardOpen ? t.keyboardOpen : t.keyboardClosed}
        </div>
      </div>
      <div>
        <div style={{ color: '#a1a1aa', fontSize: '10px' }}>{t.hudActiveInput}</div>
        <div style={{ fontWeight: 600, color: '#c084fc' }}>
          {engine.isFloatingSuppressed ? 'BODY' : engine.isKeyboardOpen ? 'FLOATING' : 'NONE'}
        </div>
      </div>
    </div>
  )
}
