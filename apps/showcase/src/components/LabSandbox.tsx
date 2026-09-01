import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import type { LabInfo, EvaluationItem } from '../data/labsData'
import type { Language } from '../i18n'
import {
  SubpageLayout,
  FloatingInput,
  useMobileKeyboard,
} from 'react-mobile-keyboard-layout'

interface LabSandboxProps {
  lab: LabInfo
  lang: Language
  onClose: () => void
}

const EVAL_TITLES: Record<EvaluationItem['id'], { en: string; ko: string }> = {
  '1-1': { en: '1-1. Header 0.0px Top-Lock', ko: '1-1. 상단 헤더 0.0px 고정' },
  '1-2': { en: '1-2. Floating Input Visibility', ko: '1-2. 플로팅 인풋 키보드 위 노출' },
  '1-3': { en: '1-3. Bottom Inset Gap Snap', ko: '1-3. 하단 여백 12px 초밀착' },
  '1-4': { en: '1-4. 0.0px Reading Scroll Anchor', ko: '1-4. 본문 읽기 스크롤 0.0px 보존' },
  '2-1': { en: '2-1. Body Focus Floating Suppression', ko: '2-1. 본문 인풋 입력 시 플로팅 숨김' },
  '3-1': { en: '3-1. Seamless Focus Dismiss Restore', ko: '3-1. 본문 포커스 해제 시 즉시 복원' },
}

/* ==========================================================================
   Main Sandbox Dispatcher
   ========================================================================== */

export const LabSandbox = ({ lab, lang, onClose }: LabSandboxProps) => {
  const isWinner = lab.id === 'exp03_d'

  if (isWinner) {
    return <WinnerLabSandbox lab={lab} lang={lang} onClose={onClose} />
  }

  return <SimulatedLabSandbox lab={lab} lang={lang} onClose={onClose} />
}

/* ==========================================================================
   Shared Evaluation Checklist & Decision Component
   ========================================================================== */

const LabEvaluationSection = ({ lab, lang }: { lab: LabInfo; lang: Language }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. Hypothesis Card */}
      <div style={{
        padding: '12px',
        borderRadius: '12px',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#d4d4d8',
      }}>
        <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: '4px' }}>
          🧪 {lang === 'ko' ? '실험 가설' : 'Hypothesis'}
        </div>
        <div>{lab.hypothesis[lang]}</div>
      </div>

      {/* 2. 6-Point Evaluation Checklist */}
      <div style={{
        padding: '14px',
        borderRadius: '12px',
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f4f4f5', marginBottom: '2px' }}>
          📊 {lang === 'ko' ? '6대 평가 항목 및 기대 결과' : '6 Evaluation Criteria & Expected Results'}
        </div>

        {lab.evaluations.map((evalItem) => {
          const title = EVAL_TITLES[evalItem.id][lang]
          const isPass = evalItem.pass

          return (
            <div
              key={evalItem.id}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: isPass ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                border: `1px solid ${isPass ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                  {title}
                </span>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: isPass ? '#22c55e' : '#ef4444',
                  color: isPass ? '#052e16' : '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                }}>
                  {isPass ? (lang === 'ko' ? '✅ PASS (성공 기대)' : '✅ PASS') : (lang === 'ko' ? '❌ FAIL (결함 발생)' : '❌ FAIL')}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: isPass ? '#86efac' : '#fca5a5', lineHeight: '1.3' }}>
                {evalItem.comment[lang]}
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. Key Finding & Next Decision */}
      <div style={{
        padding: '14px',
        borderRadius: '12px',
        backgroundColor: lab.status === 'winner' ? 'rgba(34, 197, 94, 0.1)' : '#18181b',
        border: `1px solid ${lab.status === 'winner' ? '#22c55e' : '#3f3f46'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '12px',
        lineHeight: '1.4',
      }}>
        <div>
          <strong style={{ color: lab.status === 'winner' ? '#4ade80' : '#60a5fa' }}>
            💡 {lang === 'ko' ? '핵심 발견' : 'Key Finding'}:
          </strong>{' '}
          <span style={{ color: '#d4d4d8' }}>{lab.keyFinding[lang]}</span>
        </div>

        <div style={{
          paddingTop: '6px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <strong style={{ color: lab.status === 'winner' ? '#22c55e' : '#fbbf24' }}>
            ➡️ {lang === 'ko' ? '다음 결정' : 'Next Decision'}:
          </strong>{' '}
          <span style={{ color: '#f4f4f5' }}>{lab.nextDecision[lang]}</span>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   1. WINNER EXPERIMENT (EXP-03-D) - Real Library Engine Execution
   ========================================================================== */

const WinnerLabSandbox = ({ lab, lang, onClose }: LabSandboxProps) => {
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const engine = useMobileKeyboard({ bodyRef })
  const [floatingVal, setFloatingVal] = useState('')
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
      <SubpageLayout
        bodyRef={bodyRef}
        keyboardEngine={engine}
        header={
          <header
            role="banner"
            className="rmkl-subpage-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '12px',
              paddingRight: '12px',
            }}
          >
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
              {lang === 'ko' ? '← 실험실 목록' : '← Back'}
            </button>

            <div style={{ fontSize: '13px', fontWeight: 700, color: '#4ade80' }}>
              EXP-03-D (Winner ★)
            </div>

            <span style={{
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#22c55e',
              color: '#052e16',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              WINNER
            </span>
          </header>
        }
        footer={
          <FloatingInput
            value={floatingVal}
            onChange={setFloatingVal}
            onSubmit={() => setFloatingVal('')}
            placeholder={lang === 'ko' ? 'Zero-Shift 키보드 테스트...' : 'Test zero-shift keyboard input...'}
            {...engine.floatingProps}
            isSuppressed={engine.isFloatingSuppressed}
            isKeyboardOpen={engine.isKeyboardOpen}
          />
        }
      >
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Interactive Form Controls */}
          <div style={{
            marginTop: '12px',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa' }}>
              🎮 {lang === 'ko' ? '실기기 폼 컨트롤 테스트' : 'Form Controls'}
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '4px' }}>
                {lang === 'ko' ? '본문 텍스트 인풋 (터치 시 플로팅 바 0px 자동 숨김)' : 'Body Text Input'}
              </label>
              <input
                type="text"
                value={bodyVal}
                onChange={(e) => setBodyVal(e.target.value)}
                placeholder={lang === 'ko' ? '터치하여 Focus Handover 테스트...' : 'Tap here to test focus handover...'}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minHeight: '42px',
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

            <div>
              <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '4px' }}>
                {lang === 'ko' ? '네이티브 날짜 피커' : 'Native Date Picker'}
              </label>
              <input
                type="date"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minHeight: '42px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #3f3f46',
                  backgroundColor: '#09090b',
                  color: '#f4f4f5',
                  fontSize: '14px',
                  outline: 'none',
                  WebkitAppearance: 'none',
                }}
              />
            </div>
          </div>

          {/* Evaluations & Next Decisions */}
          <LabEvaluationSection lab={lab} lang={lang} />

          {/* Reading Target Row */}
          <div style={{
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid #3b82f6',
            fontSize: '13px',
            color: '#60a5fa',
            fontWeight: 600,
            lineHeight: '1.4',
          }}>
            🎯 {lang === 'ko' ? '[TARGET ROW #5] 키보드가 열릴 때 이 박스의 위치가 0.0px로 그대로 고정되는지 확인하세요!' : '[TARGET ROW #5] Check 0.0px reading line freeze when keyboard opens!'}
          </div>

          {/* Extra test rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid #27272a',
                fontSize: '12px',
                color: '#d4d4d8',
              }}
            >
              Item #{i + 6} — Zero-shift feed row
            </div>
          ))}
        </div>
      </SubpageLayout>
    </div>
  )
}

/* ==========================================================================
   2. HISTORICAL LABS (EXP-01 ~ EXP-03-C) - Real Flaw Simulations
   ========================================================================== */

const SimulatedLabSandbox = ({ lab, lang, onClose }: LabSandboxProps) => {
  const [windowScrollY, setWindowScrollY] = useState(0)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [bodyInputVal, setBodyInputVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingInputVal, setFloatingInputVal] = useState('')
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [isSuppressed, setIsSuppressed] = useState(false)

  const isExp01 = lab.id === 'exp01'
  const isExp01A = lab.id === 'exp01_a'
  const isExp01B = lab.id === 'exp01_b'
  const isExp02A = lab.id === 'exp02_a'
  const isExp02C = lab.id === 'exp02_c' || lab.id === 'exp02_d'
  const isExp03A = lab.id === 'exp03_a'
  const isExp03B = lab.id === 'exp03_b'
  const isExp03C = lab.id === 'exp03_c'

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const closedScrollTopRef = useRef(0)
  const closedHeightRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => setWindowScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const startRafTopLock = useCallback(() => {
    if (!isExp02C && !isExp03A && !isExp03B && !isExp03C) return
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
    const startTime = performance.now()
    const step = (now: number) => {
      if (window.scrollY !== 0) window.scrollTo(0, 0)
      if (now - startTime < 350) {
        rafIdRef.current = requestAnimationFrame(step)
      } else {
        rafIdRef.current = null
      }
    }
    rafIdRef.current = requestAnimationFrame(step)
  }, [isExp02C, isExp03A, isExp03B, isExp03C])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleVv = () => {
      setVvHeight(vv.height)
      const open = window.innerHeight - vv.height > 100
      setIsKeyboardOpen(open)

      if (isExp02A && open) window.scrollTo(0, 0)
      if ((isExp02C || isExp03A || isExp03B || isExp03C) && open) startRafTopLock()

      // EXP-03-C: 0.0px Coordinate Preservation Formula
      if (isExp03C && bodyRef.current) {
        const el = bodyRef.current
        if (open) {
          if (closedHeightRef.current === null) {
            closedHeightRef.current = el.clientHeight
            closedScrollTopRef.current = el.scrollTop
          }
          const deltaH = closedHeightRef.current - el.clientHeight
          if (deltaH > 0) el.scrollTop = closedScrollTopRef.current + deltaH
        } else {
          closedHeightRef.current = null
        }
      }
    }
    vv.addEventListener('resize', handleVv)
    return () => vv.removeEventListener('resize', handleVv)
  }, [isExp02A, isExp02C, isExp03A, isExp03B, isExp03C, startRafTopLock])

  const handleBodyFocus = () => {
    if (isExp03A || isExp03B || isExp03C) setIsSuppressed(true)
    startRafTopLock()
  }

  const handleFloatingFocus = () => {
    setIsSuppressed(false)
    startRafTopLock()
  }

  // Root sandbox dimensions
  const rootHeightStyle: CSSProperties = isExp01
    ? { height: '100vh' }
    : isExp01B
    ? { height: '100dvh' }
    : isKeyboardOpen && vvHeight > 0
    ? { height: `${vvHeight}px`, maxHeight: `${vvHeight}px` }
    : { height: '100%' }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: isKeyboardOpen && vvHeight > 0 && !isExp01 && !isExp01B ? undefined : 0,
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      ...rootHeightStyle,
    }}>
      {/* Top Header */}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: windowScrollY === 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
            scrollY: {windowScrollY.toFixed(0)}px {windowScrollY === 0 ? '✓' : '⚠️'}
          </span>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa' }}>
            {lab.id.toUpperCase().replace('_', '-')}
          </div>
        </div>

        <span style={{
          padding: '3px 8px',
          borderRadius: '6px',
          backgroundColor: lab.status === 'progress' ? '#3b82f6' : '#ef4444',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 700,
        }}>
          {lab.status.toUpperCase()}
        </span>
      </header>

      {/* Scrollable Body */}
      <main
        ref={bodyRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '14px 16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Interactive Form Controls */}
        <div style={{
          padding: '12px',
          borderRadius: '12px',
          backgroundColor: '#18181b',
          border: '1px solid #27272a',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa' }}>
            🎮 {lang === 'ko' ? '실기기 폼 컨트롤 테스트' : 'Form Controls'}
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '4px' }}>
              {lang === 'ko' ? '본문 텍스트 인풋' : 'Body Text Input'}
            </label>
            <input
              type="text"
              value={bodyInputVal}
              onChange={(e) => setBodyInputVal(e.target.value)}
              onFocus={handleBodyFocus}
              placeholder={lang === 'ko' ? '터치하여 본문 인풋 테스트...' : 'Tap to test body focus...'}
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

          <div>
            <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '4px' }}>
              {lang === 'ko' ? '네이티브 날짜 피커' : 'Native Date Picker'}
            </label>
            <input
              type="date"
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
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
                WebkitAppearance: 'none',
              }}
            />
          </div>
        </div>

        {/* Evaluations & Next Decisions */}
        <LabEvaluationSection lab={lab} lang={lang} />

        {/* Reading Target Row */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '10px',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid #3b82f6',
          fontSize: '12px',
          color: '#60a5fa',
          fontWeight: 600,
        }}>
          🎯 {lang === 'ko' ? '[TARGET ROW #5] 키보드를 열 때 이 줄이 고정되는지 확인하세요!' : '[TARGET ROW #5] Check scroll anchor on keyboard open!'}
        </div>
      </main>

      {/* Floating Input Bar */}
      {!isSuppressed && (
        <footer
          style={{
            padding: isExp01A && isKeyboardOpen ? '8px 16px 34px' : '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
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
              placeholder={isExp01 ? 'Naive fixed input (gets covered on iOS)...' : 'Test input...'}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: '#f4f4f5',
                fontSize: '14px',
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
  )
}
