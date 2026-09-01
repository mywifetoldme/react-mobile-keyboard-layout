import { useState, useEffect, useRef, type CSSProperties } from 'react'
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
  '1-1': { en: '1-1. Header Top-Lock on Keyboard Active', ko: '1-1. 키보드 활성화 시 상단 헤더 고정' },
  '1-2': { en: '1-2. Single Scrollport on Keyboard Active', ko: '1-2. 키보드 활성화 시 단일 스크롤 유지' },
  '1-3': { en: '1-3. Safe Area Inset Removal on Keyboard Active', ko: '1-3. 키보드 활성화 시 Safe Area Inset 제거' },
  '1-4': { en: '1-4. Body Bottom Scroll Anchoring on Keyboard Active', ko: '1-4. 키보드 활성화 시 바디 하단 스크롤 앵커링' },
  '2-1': { en: '2-1. Focus Handover on Body Form Input', ko: '2-1. 본문 폼 입력 시 포커스 핸드오버' },
  '3-1': { en: '3-1. Seamless Restoration on Focus Blur', ko: '3-1. 본문 포커스 해제 시 깜빡임 없는 복원' },
}

/* ==========================================================================
   Shared UI Subcomponents
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
          const isPass = evalItem.status === 'pass'
          const isFail = evalItem.status === 'fail'
          const isNa = evalItem.status === 'na'

          const badgeBg = isPass ? '#22c55e' : isFail ? '#ef4444' : '#3f3f46'
          const badgeColor = isPass ? '#052e16' : '#ffffff'
          const badgeText = isPass ? '✅ PASS' : isFail ? '❌ FAIL' : '⚪ N/A'

          const cardBg = isPass ? 'rgba(34, 197, 94, 0.06)' : isFail ? 'rgba(239, 68, 68, 0.06)' : 'rgba(113, 113, 122, 0.06)'
          const cardBorder = isPass ? 'rgba(34, 197, 94, 0.3)' : isFail ? 'rgba(239, 68, 68, 0.3)' : 'rgba(113, 113, 122, 0.2)'
          const commentColor = isPass ? '#86efac' : isFail ? '#fca5a5' : '#a1a1aa'

          return (
            <div
              key={evalItem.id}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: isNa ? '#a1a1aa' : '#f4f4f5' }}>
                  {title}
                </span>
                <span style={{
                  width: '62px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  fontSize: '10px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}>
                  {badgeText}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: commentColor, lineHeight: '1.3' }}>
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

const LabHeader = ({ lab, lang, onClose, windowScrollY }: { lab: LabInfo; lang: Language; onClose: () => void; windowScrollY: number }) => (
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
      backgroundColor: lab.status === 'winner' ? '#22c55e' : lab.status === 'progress' ? '#3b82f6' : '#ef4444',
      color: '#ffffff',
      fontSize: '11px',
      fontWeight: 700,
    }}>
      {lab.status.toUpperCase()}
    </span>
  </header>
)

const LabFormSection = ({
  lang,
  bodyVal,
  setBodyVal,
  dateVal,
  setDateVal,
  onBodyFocus,
}: {
  lang: Language
  bodyVal: string
  setBodyVal: (v: string) => void
  dateVal: string
  setDateVal: (v: string) => void
  onBodyFocus?: () => void
}) => (
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
        value={bodyVal}
        onChange={(e) => setBodyVal(e.target.value)}
        onFocus={onBodyFocus}
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
)

const LabFloatingInput = ({
  value,
  onChange,
  onFocus,
  placeholder,
  style,
}: {
  value: string
  onChange: (v: string) => void
  onFocus?: () => void
  placeholder: string
  style?: CSSProperties
}) => (
  <footer
    style={{
      padding: '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
      backgroundColor: '#18181b',
      borderTop: '1px solid #27272a',
      flexShrink: 0,
      ...style,
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
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
        onClick={() => onChange('')}
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
        전송
      </button>
    </div>
  </footer>
)

/* ==========================================================================
   1. EXP-01: Baseline Standard Fixed
   ========================================================================== */

function Exp01Sandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: '100vh',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 16px 90px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '90px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        placeholder="Naive fixed input (Safari pans window)..."
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      />
    </div>
  )
}

/* ==========================================================================
   2. EXP-01-A: Dynamic Safe Area Inset
   ========================================================================== */

function Exp01ASandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      const open = vv.height < window.innerHeight - 80
      setIsKeyboardOpen(open)
    }
    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: '100vh',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 16px 90px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '90px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        placeholder="Dynamic Inset attempt (visualViewport check)..."
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: isKeyboardOpen ? '8px 16px 34px' : '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
        }}
      />
    </div>
  )
}

/* ==========================================================================
   3. EXP-01-B: Document Scroll Lock (Header Lock Attempt)
   ========================================================================== */

function Exp01BSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleFloatingFocus = () => {
    const lockDocumentScroll = () => {
      window.scrollTo(0, 0)
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0
      if (document.documentElement) document.documentElement.scrollTop = 0
      if (document.body) document.body.scrollTop = 0
    }
    lockDocumentScroll()
    requestAnimationFrame(lockDocumentScroll)
    setTimeout(lockDocumentScroll, 50)
    setTimeout(lockDocumentScroll, 150)
    setTimeout(lockDocumentScroll, 300)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: '100vh',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 16px 90px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '90px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onFocus={handleFloatingFocus}
        placeholder="Tap to test scrollTo(0,0) (input gets buried!)..."
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      />
    </div>
  )
}

/* ==========================================================================
   4. EXP-02: Pure CSS 100dvh In-Flow
   ========================================================================== */

function Exp02Sandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: '100dvh',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        placeholder="Pure CSS 100dvh In-Flow input..."
      />
    </div>
  )
}

/* ==========================================================================
   5. EXP-02-A: Dynamic visualViewport Binding
   ========================================================================== */

function Exp02ASandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      setVvHeight(vv.height)
      setIsKeyboardOpen(window.innerHeight - vv.height > 80)
    }
    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      maxHeight: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        placeholder="Dynamic visualViewport.height 1:1 input..."
      />
    </div>
  )
}

/* ==========================================================================
   6. EXP-02-B: Top Anchor & Scroll Lock
   ========================================================================== */

function Exp02BSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      setVvHeight(vv.height)
      const open = window.innerHeight - vv.height > 80
      setIsKeyboardOpen(open)
      if (open) window.scrollTo(0, 0)
    }
    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      maxHeight: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onFocus={() => window.scrollTo(0, 0)}
        placeholder="Top Anchor Lock (Header slides on resize)..."
      />
    </div>
  )
}

/* ==========================================================================
   7. EXP-02-C: Transform translateY Offset Tracking
   ========================================================================== */

function Exp02CSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [vvOffsetTop, setVvOffsetTop] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.offsetTop : 0)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleVv = () => setVvOffsetTop(vv.offsetTop)
    vv.addEventListener('resize', handleVv)
    vv.addEventListener('scroll', handleVv)
    return () => {
      vv.removeEventListener('resize', handleVv)
      vv.removeEventListener('scroll', handleVv)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '100%',
      transform: `translateY(${vvOffsetTop}px)`,
      transition: 'transform 0.05s linear',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        placeholder="Offset translateY Tracking (120Hz strobe artifact)..."
      />
    </div>
  )
}

/* ==========================================================================
   8. EXP-02-D: Zero-Jank Input Shell Touch Lock
   ========================================================================== */

function Exp02DSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      setVvHeight(vv.height)
      const open = window.innerHeight - vv.height > 80
      setIsKeyboardOpen(open)
      if (open) window.scrollTo(0, 0)
    }
    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      maxHeight: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onFocus={() => window.scrollTo(0, 0)}
        placeholder="touch-action: none shell lock..."
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}

/* ==========================================================================
   9. EXP-03-A: Zero-Gap Inset & HUD Relocation
   ========================================================================== */

function Exp03ASandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      setVvHeight(vv.height)
      const open = window.innerHeight - vv.height > 80
      setIsKeyboardOpen(open)
      if (open) window.scrollTo(0, 0)
    }
    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      maxHeight: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onFocus={() => window.scrollTo(0, 0)}
        placeholder="Safe area drops to 8px (causes 34px scroll jump)..."
        style={{
          padding: isKeyboardOpen ? '8px 16px' : '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
        }}
      />
    </div>
  )
}

/* ==========================================================================
   10. EXP-03-B: Body ResizeObserver Scroll Anchoring
   ========================================================================== */

function Exp03BSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const closedScrollTopRef = useRef(0)
  const closedHeightRef = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      setVvHeight(vv.height)
      const open = window.innerHeight - vv.height > 80
      setIsKeyboardOpen(open)
      if (open) window.scrollTo(0, 0)

      if (bodyRef.current) {
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
    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      maxHeight: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

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
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onFocus={() => window.scrollTo(0, 0)}
        placeholder="ResizeObserver delta-H scroll compensation..."
        style={{
          padding: isKeyboardOpen ? '8px 16px' : '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
        }}
      />
    </div>
  )
}

/* ==========================================================================
   11. EXP-03-C: Inline Focus Handover & Floating Suppression
   ========================================================================== */

function Exp03CSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [isSuppressed, setIsSuppressed] = useState(false)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const closedScrollTopRef = useRef(0)
  const closedHeightRef = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      setVvHeight(vv.height)
      const open = window.innerHeight - vv.height > 80
      setIsKeyboardOpen(open)
      if (open) window.scrollTo(0, 0)

      if (bodyRef.current) {
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
    vv.addEventListener('resize', handleResize)
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      maxHeight: isKeyboardOpen && vvHeight > 0 ? `${vvHeight}px` : '100%',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

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
        <LabFormSection
          lang={lang}
          bodyVal={bodyVal}
          setBodyVal={setBodyVal}
          dateVal={dateVal}
          setDateVal={setDateVal}
          onBodyFocus={() => setIsSuppressed(true)}
        />
        <LabEvaluationSection lab={lab} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      {!isSuppressed && (
        <LabFloatingInput
          value={floatingVal}
          onChange={setFloatingVal}
          onFocus={() => {
            setIsSuppressed(false)
            window.scrollTo(0, 0)
          }}
          placeholder="Focus Handover (0px collapse on body input focus)..."
          style={{
            padding: isKeyboardOpen ? '8px 16px' : '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
          }}
        />
      )}
    </div>
  )
}

/* ==========================================================================
   12. EXP-03-D: WINNER ★ (Production Library Architecture)
   ========================================================================== */

function Exp03DSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [floatingVal, setFloatingVal] = useState('')
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const bodyRef = useRef<HTMLDivElement | null>(null)

  const engine = useMobileKeyboard({
    bodyRef,
  })

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <SubpageLayout
        keyboardEngine={engine}
        bodyRef={bodyRef}
        header={
          <header
            style={{
              height: '52px',
              paddingTop: 'env(safe-area-inset-top, 0px)',
              backgroundColor: '#18181b',
              borderBottom: '1px solid #27272a',
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
              {lang === 'ko' ? '← 나가기' : '← Back'}
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
          <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
          <LabEvaluationSection lab={lab} lang={lang} />
          <div style={{ height: '40px', flexShrink: 0 }} />
        </div>
      </SubpageLayout>
    </div>
  )
}

/* ==========================================================================
   Main Sandbox Dispatcher
   ========================================================================== */

export const LabSandbox = ({ lab, lang, onClose }: LabSandboxProps) => {
  switch (lab.id) {
    case 'exp01':
      return <Exp01Sandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp01_a':
      return <Exp01ASandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp01_b':
      return <Exp01BSandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp02':
      return <Exp02Sandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp02_a':
      return <Exp02ASandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp02_b':
      return <Exp02BSandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp02_c':
      return <Exp02CSandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp02_d':
      return <Exp02DSandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp03_a':
      return <Exp03ASandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp03_b':
      return <Exp03BSandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp03_c':
      return <Exp03CSandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp03_d':
    default:
      return <Exp03DSandbox lab={lab} lang={lang} onClose={onClose} />
  }
}
