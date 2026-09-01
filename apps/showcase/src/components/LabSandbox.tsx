import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import type { LabInfo } from '../data/labsData'
import type { Language } from '../i18n'
import { isKeyboardTextInput } from 'react-mobile-keyboard-layout'

interface LabSandboxProps {
  lab: LabInfo
  lang: Language
  onClose: () => void
}

export const LabSandbox = ({ lab, lang, onClose }: LabSandboxProps) => {
  const [windowScrollY, setWindowScrollY] = useState(0)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [bodyInputVal, setBodyInputVal] = useState('')
  const [floatingInputVal, setFloatingInputVal] = useState('')
  const [activeFsm, setActiveFsm] = useState<'none' | 'floating' | 'body'>('none')
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [isSuppressed, setIsSuppressed] = useState(false)

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const closedScrollTopRef = useRef(0)
  const closedHeightRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)

  // Real-time window scroll monitor
  useEffect(() => {
    const handleScroll = () => {
      setWindowScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Physical implementation switches based on lab ID
  const isExp01 = lab.id === 'exp01' // Naive fixed
  const isExp01A = lab.id === 'exp01_a' // Raw vv
  const isExp01B = lab.id === 'exp01_b' // dvh
  const isExp02 = lab.id === 'exp02' // Body lock
  const isExp02A = lab.id === 'exp02_a' // Single scrollTo
  const isExp02B = lab.id === 'exp02_b' // preventScroll focus
  const isExp02C = lab.id === 'exp02_c' || lab.id === 'exp02_d' // rAF lock
  const isExp03A = lab.id === 'exp03_a' // Dual suppression
  const isExp03B = lab.id === 'exp03_b' // 3-state FSM
  const isExp03C = lab.id === 'exp03_c' // Math formula
  const isWinner = lab.id === 'exp03_d' // Winner

  // 120Hz rAF continuous top-lock loop (for 02-C, 03-B, 03-C, 03-D)
  const startRafTopLock = useCallback(() => {
    if (!isExp02C && !isExp03A && !isExp03B && !isExp03C && !isWinner) return
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
    const startTime = performance.now()
    const step = (now: number) => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
      if (now - startTime < 350) {
        rafIdRef.current = requestAnimationFrame(step)
      } else {
        rafIdRef.current = null
      }
    }
    rafIdRef.current = requestAnimationFrame(step)
  }, [isExp02C, isExp03A, isExp03B, isExp03C, isWinner])

  // Viewport listener
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const handleVv = () => {
      setVvHeight(vv.height)
      const open = window.innerHeight - vv.height > 100
      setIsKeyboardOpen(open)

      // EXP-02-A: Single scrollTo(0,0) once
      if (isExp02A && open) {
        window.scrollTo(0, 0)
      }

      // EXP-02-C ~ EXP-03-D: Continuous rAF lock
      if ((isExp02C || isExp03A || isExp03B || isExp03C || isWinner) && open) {
        startRafTopLock()
      }

      // EXP-03-C / 03-D: Coordinate Math Formula
      if ((isExp03C || isWinner) && bodyRef.current) {
        const el = bodyRef.current
        if (open) {
          if (closedHeightRef.current === null) {
            closedHeightRef.current = el.clientHeight
            closedScrollTopRef.current = el.scrollTop
          }
          const deltaH = closedHeightRef.current - (vv.height - 110)
          if (deltaH > 0) {
            el.scrollTop = closedScrollTopRef.current + deltaH
          }
        } else {
          closedHeightRef.current = null
        }
      }
    }

    vv.addEventListener('resize', handleVv)
    vv.addEventListener('scroll', handleVv)
    return () => {
      vv.removeEventListener('resize', handleVv)
      vv.removeEventListener('scroll', handleVv)
    }
  }, [isExp02A, isExp02C, isExp03A, isExp03B, isExp03C, isWinner, startRafTopLock])

  // Focus Handlers
  const handleBodyFocus = () => {
    setActiveFsm('body')
    if (isExp03A) {
      // Boolean toggle causes flicker
      setIsSuppressed(true)
    }
    if (isExp03B || isExp03C || isWinner) {
      setIsSuppressed(true)
    }
    startRafTopLock()
  }

  const handleFloatingFocus = () => {
    setActiveFsm('floating')
    setIsSuppressed(false)
    startRafTopLock()
  }

  const handleFloatingBlur = () => {
    setTimeout(() => {
      setActiveFsm('none')
      setIsSuppressed(false)
    }, 50)
  }

  // Calculate container height style
  const getContainerHeight = (): CSSProperties => {
    if (isExp01) return { height: '100vh', position: 'relative' }
    if (isExp01B) return { height: '100dvh', position: 'relative' }
    if (isExp01A || isExp02 || isExp02A || isExp02B || isExp02C || isExp03A || isExp03B || isExp03C || isWinner) {
      return {
        height: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
        maxHeight: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      }
    }
    return { height: '100%' }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Top Header - Isolated in 03-D, static/moving in others */}
      <header style={{
        height: '52px',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        backgroundColor: '#18181b',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '12px',
        paddingRight: '12px',
        flexShrink: 0,
        zIndex: 50,
      }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            backgroundColor: '#27272a',
            color: '#f4f4f5',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {lang === 'ko' ? '← 나가기' : '← Back'}
        </button>

        <div style={{ fontSize: '13px', fontWeight: 700, color: isWinner ? '#4ade80' : '#60a5fa' }}>
          {lab.id.toUpperCase().replace('_', '-')}
        </div>

        <span style={{
          padding: '3px 8px',
          borderRadius: '6px',
          backgroundColor: isWinner ? '#22c55e' : lab.status === 'progress' ? '#3b82f6' : '#ef4444',
          color: isWinner ? '#052e16' : '#ffffff',
          fontSize: '11px',
          fontWeight: 700,
        }}>
          {isWinner ? 'WINNER' : lab.status.toUpperCase()}
        </span>
      </header>

      {/* Physics HUD Overlay Bar */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: '#121214',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        fontFamily: 'monospace',
        flexShrink: 0,
      }}>
        <div>
          <span style={{ color: '#a1a1aa' }}>window.scrollY: </span>
          <span style={{
            fontWeight: 700,
            color: windowScrollY === 0 ? '#4ade80' : '#f87171',
          }}>
            {windowScrollY.toFixed(1)}px {windowScrollY === 0 ? '✓' : '⚠️ DRIFT'}
          </span>
        </div>

        <div>
          <span style={{ color: '#a1a1aa' }}>vv.height: </span>
          <span style={{ fontWeight: 700, color: '#60a5fa' }}>
            {vvHeight.toFixed(0)}px
          </span>
        </div>

        <div>
          <span style={{ color: '#a1a1aa' }}>FSM: </span>
          <span style={{ fontWeight: 700, color: activeFsm === 'none' ? '#a1a1aa' : '#fbbf24' }}>
            {activeFsm}
          </span>
        </div>
      </div>

      {/* Experiment Hypothesis Banner */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: isWinner ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.08)',
        borderBottom: `1px solid ${isWinner ? '#22c55e' : '#3f3f46'}`,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '12px', color: '#f4f4f5', lineHeight: '1.4' }}>
          <strong>{lab.title[lang]}</strong>: {lab.description[lang]}
        </div>
        <div style={{ fontSize: '11px', color: isWinner ? '#86efac' : '#93c5fd', marginTop: '2px' }}>
          💡 {lab.keyFinding[lang]}
        </div>
      </div>

      {/* Resizing / Static Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          ...getContainerHeight(),
        }}
      >
        {/* Scrollable Body */}
        <main
          ref={bodyRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Test Inline Body Form Input */}
          <div style={{
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
          }}>
            <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
              Body Form Input (Test Focus Handover)
            </label>
            <input
              type="text"
              value={bodyInputVal}
              onChange={(e) => setBodyInputVal(e.target.value)}
              onFocus={handleBodyFocus}
              onPointerDown={(e) => {
                if (isExp02B || isWinner) {
                  const target = e.target as HTMLElement | null
                  if (target && isKeyboardTextInput(target)) {
                    e.stopPropagation()
                    startRafTopLock()
                    target.focus({ preventScroll: true })
                  }
                }
              }}
              placeholder="Tap to test body focus..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                minHeight: '40px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #3f3f46',
                backgroundColor: '#09090b',
                color: '#f4f4f5',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Test Reading Rows */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: i === 5 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: i === 5 ? '1px solid #3b82f6' : '1px solid #27272a',
                fontSize: '12px',
                color: i === 5 ? '#60a5fa' : '#d4d4d8',
                lineHeight: '1.4',
              }}
            >
              {i === 5 ? '🎯 [TARGET ROW #6] Watch this line when tapping the input below!' : `Message #${i + 1} — Live test row for ${lab.id.toUpperCase()}`}
            </div>
          ))}
        </main>

        {/* Floating Input Bar (or Naive Fixed Bar) */}
        {!isSuppressed && (
          <footer
            style={{
              padding: isWinner && isKeyboardOpen ? '8px 16px 12px' : '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
              backgroundColor: '#18181b',
              borderTop: '1px solid #27272a',
              flexShrink: 0,
              position: isExp01 ? 'fixed' : 'relative',
              bottom: isExp01 ? 0 : undefined,
              left: isExp01 ? 0 : undefined,
              right: isExp01 ? 0 : undefined,
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#27272a',
              borderRadius: '20px',
              padding: '4px 6px 4px 12px',
            }}>
              <input
                type="text"
                value={floatingInputVal}
                onChange={(e) => setFloatingInputVal(e.target.value)}
                onFocus={handleFloatingFocus}
                onBlur={handleFloatingBlur}
                onPointerDown={(e) => {
                  if (isWinner || isExp02B) {
                    startRafTopLock()
                    e.preventDefault()
                    const target = e.target as HTMLElement | null
                    target?.focus({ preventScroll: true })
                  }
                }}
                placeholder={isExp01 ? 'Naive fixed input (gets covered on iOS)...' : 'Test zero-shift keyboard input...'}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  color: '#f4f4f5',
                  fontSize: '14px',
                  lineHeight: '22px',
                  padding: '4px 0',
                }}
              />
              <button
                type="button"
                onClick={() => setFloatingInputVal('')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Send
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}
