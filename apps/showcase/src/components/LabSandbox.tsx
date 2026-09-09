import { useState, useEffect, useRef, useCallback, type CSSProperties, type RefObject, type PointerEvent as ReactPointerEvent } from 'react'
import type { LabInfo, EvaluationItem } from '../data/labsData'
import type { Language } from '../i18n'
import {
  SubpageLayout,
  FloatingInput,
  useMobileKeyboard,
  isKeyboardTextInput,
} from 'react-mobile-keyboard-layout'

// EXP-03-F is frozen at v0.2.0 (03c867d0). It runs on an isolated copy of the old
// engine under ../labs/engine-v0.2 so the current package can evolve freely.
import {
  SubpageLayout as SubpageLayoutV02,
  FloatingInput as FloatingInputV02,
  useMobileKeyboard as useMobileKeyboardV02,
} from '../labs/engine-v0.2'

interface LabSandboxProps {
  lab: LabInfo
  lang: Language
  onClose: () => void
}

/* ==========================================================================
   Shared Evaluation Badge & Section Components
   ========================================================================== */

const StatusBadge = ({ status, lang }: { status: EvaluationItem['status']; lang: Language }) => {
  const isPass = status === 'pass'
  const isFail = status === 'fail'
  const text = isPass ? 'PASS' : isFail ? 'FAIL' : 'N/A'
  const bg = isPass ? 'rgba(34, 197, 94, 0.15)' : isFail ? 'rgba(239, 68, 68, 0.15)' : 'rgba(113, 113, 122, 0.15)'
  const border = isPass ? '#22c55e' : isFail ? '#ef4444' : '#52525b'
  const color = isPass ? '#4ade80' : isFail ? '#f87171' : '#a1a1aa'
  const icon = isPass ? '✅' : isFail ? '❌' : '⚪'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '62px',
        height: '20px',
        padding: '0 4px',
        borderRadius: '9999px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color,
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        boxSizing: 'border-box',
        flexShrink: 0,
        lineHeight: 1,
      }}
      title={status === 'na' ? (lang === 'ko' ? '해당 단계 미도입/평가 대상 아님' : 'Not yet in scope') : undefined}
    >
      <span style={{ marginRight: '3px', fontSize: '9px' }}>{icon}</span>
      {text}
    </span>
  )
}

const LabHeroSection = ({ lab, lang }: { lab: LabInfo; lang: Language }) => (
  <div style={{
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  }}>
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      🎯 {lang === 'ko' ? '실험 가설' : 'Hypothesis'}
    </div>
    <div style={{ fontSize: '13px', color: '#f4f4f5', lineHeight: '1.5', fontWeight: 500 }}>
      {lab.hypothesis[lang]}
    </div>
  </div>
)

const LabEvaluationSection = ({ lab, lang }: { lab: LabInfo; lang: Language }) => {
  const evalCriteria: Record<string, { ko: string; en: string }> = {
    '1-1': { ko: '1-1. 키보드 활성화 시 상단 헤더 고정', en: '1-1. Header Pinned on Keyboard Open' },
    '1-2': { ko: '1-2. 키보드 활성화 시 단일 스크롤 유지', en: '1-2. Single Unified Scroll Maintained' },
    '1-3': { ko: '1-3. 키보드 활성화 시 Safe Area Inset 제거', en: '1-3. Safe Area Inset Removed on Open' },
    '1-4': { ko: '1-4. 키보드 활성화 시 바디 하단 스크롤 앵커링', en: '1-4. Body Bottom Scroll Anchoring' },
    '2-1': { ko: '2-1. 본문 폼 입력 시 포커스 핸드오버', en: '2-1. Inline Form Focus Handover' },
    '3-1': { ko: '3-1. 본문 포커스 해제 시 깜빡임 없는 복원', en: '3-1. Zero-Flicker Dismiss Restoration' },
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      backgroundColor: '#111114',
      borderRadius: '12px',
      border: '1px solid #27272a',
      padding: '12px',
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 700,
        color: '#a1a1aa',
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>📋 {lang === 'ko' ? '실험 검증 항목' : 'Evaluation Criteria'}</span>
        <span style={{ fontSize: '11px', color: '#71717a' }}>6 Items</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {lab.evaluations.map((item) => {
          const meta = evalCriteria[item.id] || { ko: item.id, en: item.id }
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: item.status === 'na' ? '#141418' : item.status === 'pass' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${item.status === 'na' ? '#27272a' : item.status === 'pass' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: item.status === 'na' ? '#71717a' : '#f4f4f5',
                }}>
                  {meta[lang]}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: item.status === 'na' ? '#52525b' : '#a1a1aa',
                  lineHeight: '1.4',
                }}>
                  {item.comment[lang]}
                </span>
              </div>
              <StatusBadge status={item.status} lang={lang} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const LabFindingDecisionSection = ({ lab, lang }: { lab: LabInfo; lang: Language }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {/* Key Finding */}
    <div style={{
      padding: '12px',
      borderRadius: '12px',
      backgroundColor: lab.status === 'winner' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
      border: `1px solid ${lab.status === 'winner' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: lab.status === 'winner' ? '#4ade80' : '#f87171',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        🔍 {lang === 'ko' ? '실기기 관찰 결과' : 'On-Device Finding'}
      </div>
      <div style={{
        fontSize: '12px',
        color: lab.status === 'winner' ? '#bbf7d0' : '#fca5a5',
        lineHeight: '1.5',
      }}>
        {lab.keyFinding[lang]}
      </div>
    </div>

    {/* Next Engineering Decision */}
    <div style={{
      padding: '12px',
      borderRadius: '12px',
      backgroundColor: 'rgba(59, 130, 246, 0.08)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        💡 {lang === 'ko' ? '엔지니어링 판단 & 다음 결정' : 'Engineering Decision'}
      </div>
      <div style={{ fontSize: '12px', color: '#93c5fd', lineHeight: '1.5', fontWeight: 500 }}>
        {lab.nextDecision[lang]}
      </div>
    </div>
  </div>
)

const LabMessagesSection = ({ messages, lang }: { messages: string[]; lang: Language }) => (
  <div style={{
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }}>
    <div style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa' }}>
      💬 {lang === 'ko' ? `실시간 메시지 로그 (${messages.length})` : `Live Message Log (${messages.length})`}
    </div>
    {messages.length === 0 ? (
      <div style={{ fontSize: '12px', color: '#71717a' }}>
        {lang === 'ko' ? '하단 플로팅 인풋에 글을 입력하고 전송해 보세요.' : 'Type a message in the bottom floating input and tap Send.'}
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: '#27272a',
            fontSize: '13px',
            color: '#f4f4f5',
          }}>
            #{i + 1}: {msg}
          </div>
        ))}
      </div>
    )}
  </div>
)

const LabHeader = ({ lab, lang, onClose, windowScrollY }: { lab: LabInfo; lang: Language; onClose: () => void; windowScrollY: number }) => (
  <header style={{
    height: '52px',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    boxSizing: 'content-box',
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
      {lab.status === 'winner' ? 'FINAL' : lab.status.toUpperCase()}
    </span>
  </header>
)

const LabFormSection = ({
  lang,
  bodyVal,
  setBodyVal,
  dateVal,
  setDateVal,
  bodyInputRef,
  onBodyFocus,
  onBodyBlur,
}: {
  lang: Language
  bodyVal: string
  setBodyVal: (v: string) => void
  dateVal: string
  setDateVal: (v: string) => void
  bodyInputRef?: RefObject<HTMLInputElement | null>
  onBodyFocus?: () => void
  onBodyBlur?: () => void
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
        ref={bodyInputRef}
        type="text"
        value={bodyVal}
        onChange={(e) => setBodyVal(e.target.value)}
        onFocus={onBodyFocus}
        onBlur={onBodyBlur}
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
  onSubmit,
  onFocus,
  placeholder,
  style,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
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
      boxSizing: 'border-box',
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
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit?.()
          }
        }}
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
        onClick={onSubmit}
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
   1. EXP-01-A: Baseline Standard Fixed
   ========================================================================== */

function Exp01ASandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '90px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onSubmit={handleSubmit}
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
   2. EXP-01-B: Dynamic Safe Area Inset
   ========================================================================== */

function Exp01BSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [messages, setMessages] = useState<string[]>([])
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

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '90px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onSubmit={handleSubmit}
        placeholder="Dynamic Inset attempt (visualViewport check)..."
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: isKeyboardOpen ? '8px 16px 8px' : '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
        }}
      />
    </div>
  )
}

/* ==========================================================================
   3. EXP-01-C: Document Scroll Lock (Header Lock Attempt)
   ========================================================================== */

function Exp01CSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [messages, setMessages] = useState<string[]>([])

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

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '90px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onFocus={handleFloatingFocus}
        onSubmit={handleSubmit}
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
   4. EXP-01-D: Pure CSS 100dvh In-Flow
   ========================================================================== */

function Exp01DSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onSubmit={handleSubmit}
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
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const updateHeight = () => setVvHeight(vv.height)
    updateHeight()
    vv.addEventListener('resize', updateHeight)
    window.addEventListener('resize', updateHeight)
    return () => {
      vv.removeEventListener('resize', updateHeight)
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  const dynamicH = vvHeight > 0 ? `${vvHeight}px` : '100dvh'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: dynamicH,
      maxHeight: dynamicH,
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onSubmit={handleSubmit}
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
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  const lockToTop = () => {
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
  }

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const updateHeightAndLock = () => {
      setVvHeight(vv.height)
      lockToTop()
    }
    updateHeightAndLock()
    vv.addEventListener('resize', updateHeightAndLock)
    vv.addEventListener('scroll', lockToTop)
    window.addEventListener('resize', updateHeightAndLock)
    window.addEventListener('scroll', lockToTop)
    return () => {
      vv.removeEventListener('resize', updateHeightAndLock)
      vv.removeEventListener('scroll', lockToTop)
      window.removeEventListener('resize', updateHeightAndLock)
      window.removeEventListener('scroll', lockToTop)
    }
  }, [])

  const handleFocus = () => {
    lockToTop()
    requestAnimationFrame(lockToTop)
    setTimeout(lockToTop, 50)
    setTimeout(lockToTop, 150)
  }

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  const dynamicH = vvHeight > 0 ? `${vvHeight}px` : '100dvh'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: dynamicH,
      maxHeight: dynamicH,
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onFocus={handleFocus}
        onSubmit={handleSubmit}
        placeholder="Top:0 Lock (336px space concealed)..."
      />
    </div>
  )
}

/* ==========================================================================
   7. EXP-02-C: Transform translateY Offset Tracking
   ========================================================================== */

function Exp02CSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [vvOffsetTop, setVvOffsetTop] = useState(0)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleSync = () => {
      setVvHeight(vv.height)
      setVvOffsetTop(vv.offsetTop)
    }
    handleSync()
    vv.addEventListener('resize', handleSync)
    vv.addEventListener('scroll', handleSync)
    window.addEventListener('resize', handleSync)
    window.addEventListener('scroll', handleSync)
    return () => {
      vv.removeEventListener('resize', handleSync)
      vv.removeEventListener('scroll', handleSync)
      window.removeEventListener('resize', handleSync)
      window.removeEventListener('scroll', handleSync)
    }
  }, [])

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  const dynamicH = vvHeight > 0 ? `${vvHeight}px` : '100dvh'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: dynamicH,
      maxHeight: dynamicH,
      transform: `translateY(${vvOffsetTop}px)`,
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onSubmit={handleSubmit}
        placeholder="Offset translateY Tracking (stutter follow & bottom gap)..."
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
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  const lockToTop = () => {
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
  }

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const updateHeightAndLock = () => {
      setVvHeight(vv.height)
      lockToTop()
    }
    updateHeightAndLock()
    vv.addEventListener('resize', updateHeightAndLock)
    vv.addEventListener('scroll', lockToTop)
    window.addEventListener('resize', updateHeightAndLock)
    window.addEventListener('scroll', lockToTop)
    return () => {
      vv.removeEventListener('resize', updateHeightAndLock)
      vv.removeEventListener('scroll', lockToTop)
      window.removeEventListener('resize', updateHeightAndLock)
      window.removeEventListener('scroll', lockToTop)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const preventOuterTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (target && target.closest('.lab-body-scroll-area')) {
        return
      }
      if (e.cancelable) {
        e.preventDefault()
      }
    }
    window.addEventListener('touchmove', preventOuterTouchMove, { passive: false })
    return () => window.removeEventListener('touchmove', preventOuterTouchMove)
  }, [])

  const handleFocus = () => {
    lockToTop()
    requestAnimationFrame(lockToTop)
    setTimeout(lockToTop, 50)
    setTimeout(lockToTop, 150)
  }

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  const dynamicH = vvHeight > 0 ? `${vvHeight}px` : '100dvh'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: dynamicH,
      maxHeight: dynamicH,
      backgroundColor: '#09090b',
      color: '#f4f4f5',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />

      <main
        className="lab-body-scroll-area"
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onFocus={handleFocus}
        onSubmit={handleSubmit}
        placeholder="EXP-02-D Zero-Jank Touch Lock (0px motionless)..."
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}

/* ==========================================================================
   9. EXP-03-A: Zero-Gap Inset & Compact Snap
   ========================================================================== */

function Exp03ASandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [scrollY, setScrollY] = useState(0)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  const lockToTop = () => {
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
  }

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const updateHeightAndLock = () => {
      setVvHeight(vv.height)
      const open = window.innerHeight - vv.height > 80
      setIsKeyboardOpen(open)
      lockToTop()
    }
    updateHeightAndLock()
    vv.addEventListener('resize', updateHeightAndLock)
    vv.addEventListener('scroll', lockToTop)
    window.addEventListener('resize', updateHeightAndLock)
    window.addEventListener('scroll', lockToTop)
    return () => {
      vv.removeEventListener('resize', updateHeightAndLock)
      vv.removeEventListener('scroll', lockToTop)
      window.removeEventListener('resize', updateHeightAndLock)
      window.removeEventListener('scroll', lockToTop)
    }
  }, [])

  const handleFocus = () => {
    lockToTop()
    requestAnimationFrame(lockToTop)
    setTimeout(lockToTop, 50)
    setTimeout(lockToTop, 150)
  }

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  const dynamicH = vvHeight > 0 ? `${vvHeight}px` : '100dvh'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: dynamicH,
      maxHeight: dynamicH,
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onFocus={handleFocus}
        onSubmit={handleSubmit}
        placeholder="Safe area drops to 8px (bottom reading line buried by ΔH)..."
        style={{
          touchAction: 'none',
          padding: isKeyboardOpen ? '8px 16px 8px' : '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
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
  const [messages, setMessages] = useState<string[]>([])

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const closedScrollTopRef = useRef<number>(0)
  const closedBodyHeightRef = useRef<number | null>(null)
  const isKeyboardActiveRef = useRef<boolean>(false)
  const isProgrammaticScrollRef = useRef<boolean>(false)

  const lockToTop = () => {
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
  }

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 1:1 visualViewport height binding + instant top locking
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const updateHeightAndLock = () => {
      setVvHeight(vv.height)
      const open = window.innerHeight - vv.height > 80
      setIsKeyboardOpen(open)
      lockToTop()
    }
    updateHeightAndLock()
    vv.addEventListener('resize', updateHeightAndLock)
    vv.addEventListener('scroll', lockToTop)
    window.addEventListener('resize', updateHeightAndLock)
    window.addEventListener('scroll', lockToTop)
    return () => {
      vv.removeEventListener('resize', updateHeightAndLock)
      vv.removeEventListener('scroll', lockToTop)
      window.removeEventListener('resize', updateHeightAndLock)
      window.removeEventListener('scroll', lockToTop)
    }
  }, [])

  // Absolute Coordinate Estimation with Frozen Base Values (0.0px exact anchor)
  useEffect(() => {
    const el = bodyRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current || !el) return
      if (!isKeyboardActiveRef.current) {
        closedScrollTopRef.current = el.scrollTop
        closedBodyHeightRef.current = el.clientHeight
      }
    }

    el.addEventListener('scroll', handleScroll, { passive: true })

    const resizeObserver = new ResizeObserver(() => {
      if (!el) return
      const currHeight = el.clientHeight

      if (!isKeyboardActiveRef.current) {
        closedBodyHeightRef.current = currHeight
        return
      }

      if (isKeyboardActiveRef.current && closedBodyHeightRef.current !== null) {
        const deltaH = Math.round(Math.max(0, closedBodyHeightRef.current - currHeight))
        if (deltaH > 0) {
          isProgrammaticScrollRef.current = true
          el.scrollTop = Math.round(closedScrollTopRef.current + deltaH)
          requestAnimationFrame(() => {
            isProgrammaticScrollRef.current = false
          })
        }
      }
    })

    resizeObserver.observe(el)
    return () => {
      el.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [])

  // Sync keyboard open/close transitions with exact position restoration
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return

    if (isKeyboardOpen) {
      if (!isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = true
        closedScrollTopRef.current = el.scrollTop
        closedBodyHeightRef.current = el.clientHeight
      }
    } else {
      if (isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = false
        isProgrammaticScrollRef.current = true
        el.scrollTop = closedScrollTopRef.current
        requestAnimationFrame(() => {
          isProgrammaticScrollRef.current = false
        })
      }
    }
  }, [isKeyboardOpen])

  const handleFocus = () => {
    if (bodyRef.current && !isKeyboardActiveRef.current) {
      isKeyboardActiveRef.current = true
      closedScrollTopRef.current = bodyRef.current.scrollTop
      closedBodyHeightRef.current = bodyRef.current.clientHeight
    }
    lockToTop()
    requestAnimationFrame(lockToTop)
    setTimeout(lockToTop, 50)
    setTimeout(lockToTop, 150)
  }

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  const dynamicH = vvHeight > 0 ? `${vvHeight}px` : '100dvh'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: dynamicH,
      maxHeight: dynamicH,
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      <LabFloatingInput
        value={floatingVal}
        onChange={setFloatingVal}
        onFocus={handleFocus}
        onSubmit={handleSubmit}
        placeholder="ResizeObserver delta-H scroll compensation (0.0px anchor)..."
        style={{
          touchAction: 'none',
          padding: isKeyboardOpen ? '8px 16px 8px' : '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
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
  const [isBodyInputFocused, setIsBodyInputFocused] = useState(false)
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [floatingVal, setFloatingVal] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const inlineInputRef = useRef<HTMLInputElement | null>(null)
  const closedScrollTopRef = useRef<number>(0)
  const closedBodyHeightRef = useRef<number | null>(null)
  const isKeyboardActiveRef = useRef<boolean>(false)
  const isProgrammaticScrollRef = useRef<boolean>(false)

  const lockToTop = () => {
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
  }

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 1:1 visualViewport height binding + instant top locking
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const updateHeightAndLock = () => {
      setVvHeight(vv.height)
      lockToTop()
    }
    updateHeightAndLock()
    vv.addEventListener('resize', updateHeightAndLock)
    vv.addEventListener('scroll', lockToTop)
    window.addEventListener('resize', updateHeightAndLock)
    window.addEventListener('scroll', lockToTop)
    return () => {
      vv.removeEventListener('resize', updateHeightAndLock)
      vv.removeEventListener('scroll', lockToTop)
      window.removeEventListener('resize', updateHeightAndLock)
      window.removeEventListener('scroll', lockToTop)
    }
  }, [])

  // Absolute Coordinate Estimation with Frozen Base Values (0.0px exact anchor)
  useEffect(() => {
    const el = bodyRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current || !el) return
      if (!isKeyboardActiveRef.current) {
        closedScrollTopRef.current = el.scrollTop
        closedBodyHeightRef.current = el.clientHeight
      }
    }

    el.addEventListener('scroll', handleScroll, { passive: true })

    const resizeObserver = new ResizeObserver(() => {
      if (!el) return
      const currHeight = el.clientHeight

      if (!isKeyboardActiveRef.current) {
        closedBodyHeightRef.current = currHeight
        return
      }

      // If floating input is active (not body inline), apply 0.0px scroll compensation
      if (isKeyboardActiveRef.current && !isBodyInputFocused && closedBodyHeightRef.current !== null) {
        const deltaH = Math.round(Math.max(0, closedBodyHeightRef.current - currHeight))
        if (deltaH > 0) {
          isProgrammaticScrollRef.current = true
          el.scrollTop = Math.round(closedScrollTopRef.current + deltaH)
          requestAnimationFrame(() => {
            isProgrammaticScrollRef.current = false
          })
        }
      }
    })

    resizeObserver.observe(el)
    return () => {
      el.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [isBodyInputFocused])

  const isKeyboardOpen = Boolean(
    vvHeight && typeof window !== 'undefined' && vvHeight < window.innerHeight - 80
  )

  // Sync keyboard open/close transitions with exact position restoration
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return

    if (isKeyboardOpen) {
      if (!isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = true
        closedScrollTopRef.current = el.scrollTop
        closedBodyHeightRef.current = el.clientHeight
      }
    } else {
      if (isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = false
        if (!isBodyInputFocused) {
          isProgrammaticScrollRef.current = true
          el.scrollTop = closedScrollTopRef.current
          requestAnimationFrame(() => {
            isProgrammaticScrollRef.current = false
          })
        }
      }
    }
  }, [isKeyboardOpen, isBodyInputFocused])

  const handleFloatingFocus = () => {
    setIsBodyInputFocused(false)
    if (bodyRef.current && !isKeyboardActiveRef.current) {
      isKeyboardActiveRef.current = true
      closedScrollTopRef.current = bodyRef.current.scrollTop
      closedBodyHeightRef.current = bodyRef.current.clientHeight
    }
    lockToTop()
    requestAnimationFrame(lockToTop)
    setTimeout(lockToTop, 50)
    setTimeout(lockToTop, 150)
  }

  const handleBodyInputFocus = () => {
    setIsBodyInputFocused(true)
    lockToTop()
    setTimeout(() => {
      if (inlineInputRef.current) {
        inlineInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }

  const handleBodyInputBlur = () => {
    setIsBodyInputFocused(false)
  }

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  const dynamicH = vvHeight > 0 ? `${vvHeight}px` : '100dvh'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: dynamicH,
      maxHeight: dynamicH,
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
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection
          lang={lang}
          bodyVal={bodyVal}
          setBodyVal={setBodyVal}
          dateVal={dateVal}
          setDateVal={setDateVal}
          bodyInputRef={inlineInputRef}
          onBodyFocus={handleBodyInputFocus}
          onBodyBlur={handleBodyInputBlur}
        />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </main>

      {!isBodyInputFocused && (
        <LabFloatingInput
          value={floatingVal}
          onChange={setFloatingVal}
          onFocus={handleFloatingFocus}
          onSubmit={handleSubmit}
          placeholder="Focus Handover (0px collapse on body input focus)..."
          style={{
            touchAction: 'none',
            padding: isKeyboardOpen ? '8px 16px 8px' : '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
          }}
        />
      )}
    </div>
  )
}

/* ==========================================================================
   12. EXP-03-D: Isolated Fixed Header & 3-State FSM
   ========================================================================== */

function Exp03DSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [floatingVal, setFloatingVal] = useState('')
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [messages, setMessages] = useState<string[]>([])
  const [isBodyInputFocused, setIsBodyInputFocused] = useState(false)
  const [vvHeight, setVvHeight] = useState(() => typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const inlineInputRef = useRef<HTMLInputElement | null>(null)
  const closedScrollTopRef = useRef<number>(0)
  const closedBodyHeightRef = useRef<number | null>(null)
  const isKeyboardActiveRef = useRef<boolean>(false)

  const lockToTop = useCallback(() => {
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
  }, [])

  // Passive visualViewport subscription (EXP-03-D)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const updateHeightAndLock = () => {
      setVvHeight(vv.height)
      const open = window.innerHeight - vv.height > 80
      setIsKeyboardOpen(open)
      lockToTop()
    }
    updateHeightAndLock()
    vv.addEventListener('resize', updateHeightAndLock)
    vv.addEventListener('scroll', lockToTop)
    window.addEventListener('resize', updateHeightAndLock)
    window.addEventListener('scroll', lockToTop)
    return () => {
      vv.removeEventListener('resize', updateHeightAndLock)
      vv.removeEventListener('scroll', lockToTop)
      window.removeEventListener('resize', updateHeightAndLock)
      window.removeEventListener('scroll', lockToTop)
    }
  }, [lockToTop])

  // Coordinate estimation via ResizeObserver
  useEffect(() => {
    const el = bodyRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const handleScroll = () => {
      if (!isKeyboardActiveRef.current) {
        closedScrollTopRef.current = el.scrollTop
        closedBodyHeightRef.current = el.clientHeight
      }
    }
    el.addEventListener('scroll', handleScroll, { passive: true })

    const ro = new ResizeObserver(() => {
      const currHeight = el.clientHeight
      if (!isKeyboardActiveRef.current) {
        closedBodyHeightRef.current = currHeight
        closedScrollTopRef.current = el.scrollTop
      } else if (!isBodyInputFocused && closedBodyHeightRef.current !== null) {
        const deltaH = Math.max(0, closedBodyHeightRef.current - currHeight)
        if (deltaH > 0) {
          el.scrollTop = Math.round(closedScrollTopRef.current + deltaH)
        }
      }
    })
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', handleScroll)
      ro.disconnect()
    }
  }, [isBodyInputFocused])

  // Sync open/close transitions
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    if (isKeyboardOpen) {
      if (!isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = true
        closedScrollTopRef.current = el.scrollTop
        closedBodyHeightRef.current = el.clientHeight
      }
    } else {
      if (isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = false
        if (!isBodyInputFocused) {
          el.scrollTop = closedScrollTopRef.current
        }
      }
    }
  }, [isKeyboardOpen, isBodyInputFocused])

  const handleFloatingFocus = () => {
    setIsBodyInputFocused(false)
    if (bodyRef.current && !isKeyboardActiveRef.current) {
      isKeyboardActiveRef.current = true
      closedScrollTopRef.current = bodyRef.current.scrollTop
      closedBodyHeightRef.current = bodyRef.current.clientHeight
    }
    lockToTop()
    requestAnimationFrame(lockToTop)
  }

  const handleBodyInputFocus = () => {
    setIsBodyInputFocused(true)
    lockToTop()
  }

  const handleBodyInputBlur = () => {
    // 50ms asynchronous focus reset reproduces mid-screen floating pop in EXP-03-D
    setTimeout(() => {
      setIsBodyInputFocused(false)
    }, 50)
  }

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  const dynamicH = vvHeight > 0 ? `${vvHeight}px` : '100dvh'

  const mockEngine = {
    containerStyle: {
      height: dynamicH,
      maxHeight: dynamicH,
    },
    isKeyboardOpen,
    isFloatingSuppressed: isBodyInputFocused,
    floatingProps: {
      onFocus: handleFloatingFocus,
      onBlur: () => lockToTop(),
      onPointerDown: () => lockToTop(),
    },
    bodyProps: {
      onPointerDown: (e: React.PointerEvent<HTMLElement> | PointerEvent) => {
        const target = e.target as HTMLElement | null
        if (target && isKeyboardTextInput(target)) {
          e.stopPropagation()
          lockToTop()
          target.focus({ preventScroll: true })
        }
      },
    },
    scrollToBottom: () => {},
  }

  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <SubpageLayout
      keyboardEngine={mockEngine}
      bodyRef={bodyRef}
      style={{ zIndex: 300 }}
      header={<LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />}
      footer={
        <FloatingInput
          value={floatingVal}
          onChange={setFloatingVal}
          onSubmit={handleSubmit}
          placeholder={lang === 'ko' ? 'EXP-03-D: 본문 인풋 블러 시 팝 관찰...' : 'EXP-03-D: Notice pop on body blur...'}
          {...mockEngine.floatingProps}
          isSuppressed={mockEngine.isFloatingSuppressed}
          isKeyboardOpen={mockEngine.isKeyboardOpen}
        />
      }
    >
      <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection
          lang={lang}
          bodyVal={bodyVal}
          setBodyVal={setBodyVal}
          dateVal={dateVal}
          setDateVal={setDateVal}
          bodyInputRef={inlineInputRef}
          onBodyFocus={handleBodyInputFocus}
          onBodyBlur={handleBodyInputBlur}
        />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </div>
    </SubpageLayout>
  )
}

/* ==========================================================================
   13. EXP-03-E: Synchronous Viewport Teardown & Dismiss Sync (Safari Bottom Collision Roadblock)
   ========================================================================== */

function useExp03EMobileKeyboard(bodyRef: RefObject<HTMLElement | null>) {
  const [vvHeight, setVvHeight] = useState<number | null>(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      return window.visualViewport.height
    }
    return null
  })
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false)
  const [activeInputType, setActiveInputType] = useState<'none' | 'floating' | 'body'>('none')
  const activeInputTypeRef = useRef<'none' | 'floating' | 'body'>('none')
  const [isBodyInputFocused, setIsBodyInputFocused] = useState<boolean>(false)

  const closedScrollTopRef = useRef<number>(0)
  const closedBodyHeightRef = useRef<number | null>(null)
  const isKeyboardActiveRef = useRef<boolean>(false)
  const animationFrameIdRef = useRef<number | null>(null)
  const lockLoopStartTimeRef = useRef<number>(0)

  const startContinuousLockLoop = useCallback((duration = 350) => {
    if (typeof window === 'undefined') return
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current)
    }
    lockLoopStartTimeRef.current = performance.now()

    const step = (now: number) => {
      if (window.scrollY !== 0 || document.documentElement.scrollTop !== 0 || document.body.scrollTop !== 0) {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }
      if (now - lockLoopStartTimeRef.current < duration) {
        animationFrameIdRef.current = requestAnimationFrame(step)
      } else {
        animationFrameIdRef.current = null
      }
    }
    animationFrameIdRef.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [])

  // VisualViewport subscription
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleUpdate = () => {
      const currentH = vv.height
      const screenH = window.innerHeight || currentH
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null
      const hasActiveTextInput = isKeyboardTextInput(activeEl)
      const open = hasActiveTextInput && screenH - currentH > 100 && (typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window))

      setVvHeight(currentH)
      setIsKeyboardOpen(open)

      const el = bodyRef?.current
      if (open) {
        if (!isKeyboardActiveRef.current) {
          isKeyboardActiveRef.current = true
          if (el) {
            closedScrollTopRef.current = el.scrollTop
            closedBodyHeightRef.current = el.clientHeight
          }
        }
        startContinuousLockLoop()
      } else {
        if (isKeyboardActiveRef.current) {
          startContinuousLockLoop()
          isKeyboardActiveRef.current = false
          if (el && !isBodyInputFocused) {
            el.scrollTop = closedScrollTopRef.current
          }
        }
      }
    }

    handleUpdate()
    vv.addEventListener('resize', handleUpdate)
    vv.addEventListener('scroll', handleUpdate)
    return () => {
      vv.removeEventListener('resize', handleUpdate)
      vv.removeEventListener('scroll', handleUpdate)
    }
  }, [bodyRef, isBodyInputFocused, startContinuousLockLoop])

  // ResizeObserver & Coordinate Preservation
  useEffect(() => {
    const el = bodyRef?.current
    if (!el || typeof ResizeObserver === 'undefined') return

    let isProgrammatic = false
    const handleScroll = () => {
      if (isProgrammatic || isKeyboardActiveRef.current) return
      closedScrollTopRef.current = el.scrollTop
      closedBodyHeightRef.current = el.clientHeight
    }
    el.addEventListener('scroll', handleScroll, { passive: true })

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const currHeight = entry.contentRect.height
        if (currHeight <= 0) continue

        if (!isKeyboardActiveRef.current) {
          closedBodyHeightRef.current = currHeight
          closedScrollTopRef.current = el.scrollTop
        } else {
          // In 2cae8f7 (EXP-03-E): Body input focus preserves natural scroll position without boundary evasion
          if (isBodyInputFocused) {
            return
          }
          if (closedBodyHeightRef.current !== null && closedBodyHeightRef.current > currHeight) {
            const deltaH = closedBodyHeightRef.current - currHeight
            isProgrammatic = true
            el.scrollTop = closedScrollTopRef.current + deltaH
            requestAnimationFrame(() => {
              isProgrammatic = false
            })
          }
        }
      }
    })

    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', handleScroll)
      ro.disconnect()
    }
  }, [bodyRef, isBodyInputFocused])

  // Focus Handover FSM
  useEffect(() => {
    const el = bodyRef?.current
    const handleFocusIn = (e: FocusEvent) => {
      if (isKeyboardTextInput(e.target)) {
        activeInputTypeRef.current = 'body'
        setActiveInputType('body')
        setIsBodyInputFocused(true)
        startContinuousLockLoop()
      }
    }
    const handleFocusOut = (e: FocusEvent) => {
      if (isKeyboardTextInput(e.target)) {
        startContinuousLockLoop()
      }
    }

    if (el) {
      el.addEventListener('focusin', handleFocusIn)
      el.addEventListener('focusout', handleFocusOut)
    }

    const handleGlobalFocusOut = (e: FocusEvent) => {
      if (isKeyboardTextInput(e.target)) {
        queueMicrotask(() => {
          const active = document.activeElement
          if (!active || active === document.body || !isKeyboardTextInput(active)) {
            const wasFloating = activeInputTypeRef.current === 'floating'
            activeInputTypeRef.current = 'none'
            setActiveInputType('none')
            setIsBodyInputFocused(false)
            if (isKeyboardActiveRef.current) {
              isKeyboardActiveRef.current = false
              setVvHeight(null)
              setIsKeyboardOpen(false)
              startContinuousLockLoop()
              if (wasFloating && bodyRef?.current) {
                bodyRef.current.scrollTop = closedScrollTopRef.current
              }
            }
          }
        })
      }
    }

    window.addEventListener('focusout', handleGlobalFocusOut)
    return () => {
      if (el) {
        el.removeEventListener('focusin', handleFocusIn)
        el.removeEventListener('focusout', handleFocusOut)
      }
      window.removeEventListener('focusout', handleGlobalFocusOut)
    }
  }, [bodyRef, startContinuousLockLoop])

  const handleFloatingFocus = useCallback(() => {
    activeInputTypeRef.current = 'floating'
    setActiveInputType('floating')
    setIsBodyInputFocused(false)
    startContinuousLockLoop()
  }, [startContinuousLockLoop])

  const handleFloatingBlur = useCallback(() => {
    startContinuousLockLoop()
  }, [startContinuousLockLoop])

  const handleFloatingPointerDown = useCallback(() => {
    startContinuousLockLoop()
  }, [startContinuousLockLoop])

  const handleBodyPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement> | PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (target && isKeyboardTextInput(target)) {
        e.stopPropagation()
        startContinuousLockLoop()
        target.focus({ preventScroll: true })
      }
    },
    [startContinuousLockLoop],
  )

  const isFloatingSuppressed =
    activeInputType === 'body' && (isBodyInputFocused || isKeyboardOpen)

  const containerStyle: CSSProperties = vvHeight && isKeyboardOpen
    ? {
        height: `${vvHeight}px`,
        maxHeight: `${vvHeight}px`,
      }
    : {
        height: '100dvh',
        maxHeight: '100dvh',
      }

  return {
    containerStyle,
    isKeyboardOpen,
    isFloatingSuppressed,
    floatingProps: {
      onFocus: handleFloatingFocus,
      onBlur: handleFloatingBlur,
      onPointerDown: handleFloatingPointerDown,
    },
    bodyProps: {
      onPointerDown: handleBodyPointerDown,
    },
    scrollToBottom: () => {},
  }
}

function Exp03ESandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [floatingVal, setFloatingVal] = useState('')
  const [bodyVal, setBodyVal] = useState('')
  const [bottomInputVal, setBottomInputVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [messages, setMessages] = useState<string[]>([])
  const [scrollY, setScrollY] = useState(0)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Uses the exact 2cae8f7 (PR #10) engine without boundary evasion
  const engine = useExp03EMobileKeyboard(bodyRef)

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  return (
    <SubpageLayout
      keyboardEngine={engine}
      bodyRef={bodyRef}
      style={{ zIndex: 300 }}
      header={<LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />}
      footer={
        <FloatingInput
          value={floatingVal}
          onChange={setFloatingVal}
          onSubmit={handleSubmit}
          placeholder={lang === 'ko' ? 'Zero-Shift 키보드 테스트...' : 'Test zero-shift keyboard input...'}
          {...engine.floatingProps}
          isSuppressed={engine.isFloatingSuppressed}
          isKeyboardOpen={engine.isKeyboardOpen}
          style={engine.isFloatingSuppressed ? { display: 'none' } : {}}
        />
      }
    >
      <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection
          lang={lang}
          bodyVal={bodyVal}
          setBodyVal={setBodyVal}
          dateVal={dateVal}
          setDateVal={setDateVal}
        />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />

        {/* Bottom edge input placed at the very end of the scroll container */}
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '2px solid rgba(239, 68, 68, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '10px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171' }}>
            ⚠️ {lang === 'ko' ? '페이지 최하단 본문 인풋 (사파리 뷰포트 충돌 결함 재현)' : 'Very Bottom Page Input (Safari Collision Defect)'}
          </div>
          <input
            type="text"
            value={bottomInputVal}
            onChange={(e) => setBottomInputVal(e.target.value)}
            placeholder={lang === 'ko' ? '스크롤 맨 아래에서 터치해보세요...' : 'Tap here at the bottom of the page...'}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: '44px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '2px solid #ef4444',
              backgroundColor: '#09090b',
              color: '#f4f4f5',
              fontSize: '15px',
              outline: 'none',
            }}
          />
          <div style={{ fontSize: '11.5px', color: '#fca5a5', lineHeight: '1.4' }}>
            {lang === 'ko'
              ? '플로팅 바 1단계 즉시 증발(display:none)에 의한 순간 리플로우와 16px 안전 여백 부재로 사파리 WebKit의 터치 정렬이 깨져 키보드가 올라오다 도로 닫혀버리는 현상입니다.'
              : '1-step immediate suppression (display: none) sudden reflow and missing 16px boundary safe margin breaks Safari touch hit-testing, causing keyboard bounce.'}
          </div>
        </div>

        <div style={{ height: '40px', flexShrink: 0 }} />
      </div>
    </SubpageLayout>
  )
}

/* ==========================================================================
   14. EXP-03-F: FINAL WINNER (In-Viewport Boundary Evasion)
   ========================================================================== */

function Exp03FSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [floatingVal, setFloatingVal] = useState('')
  const [bodyVal, setBodyVal] = useState('')
  const [bottomInputVal, setBottomInputVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [messages, setMessages] = useState<string[]>([])
  const [scrollY, setScrollY] = useState(0)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // EXP-03-F: Uses the v0.2.0 engine copy with In-Viewport Boundary Evasion (alignPadding: 16)
  const engine = useMobileKeyboardV02({
    bodyRef,
    alignPadding: 16,
  })

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  return (
    <SubpageLayoutV02
      keyboardEngine={engine}
      bodyRef={bodyRef}
      style={{ zIndex: 300 }}
      header={<LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />}
      footer={
        <FloatingInputV02
          value={floatingVal}
          onChange={setFloatingVal}
          onSubmit={handleSubmit}
          placeholder={lang === 'ko' ? 'Zero-Shift 키보드 테스트...' : 'Test zero-shift keyboard input...'}
          {...engine.floatingProps}
          isSuppressed={engine.isFloatingSuppressed}
          isKeyboardOpen={engine.isKeyboardOpen}
        />
      }
    >
      <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />

        {/* Bottom edge input placed at the very end of the scroll container to demonstrate successful In-Viewport Boundary Evasion in EXP-03-F */}
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          border: '2px solid rgba(34, 197, 94, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '16px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#4ade80' }}>
            🛡️ {lang === 'ko' ? '페이지 최하단 본문 인풋 (경계 회피 성공)' : 'Very Bottom Page Input (Boundary Evasion Success)'}
          </div>
          <input
            type="text"
            value={bottomInputVal}
            onChange={(e) => setBottomInputVal(e.target.value)}
            placeholder={lang === 'ko' ? '스크롤 맨 끝에서 터치 ➔ 16px 안전 안착...' : 'Tap at the bottom -> Smooth 16px alignment...'}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: '44px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '2px solid #22c55e',
              backgroundColor: '#09090b',
              color: '#f4f4f5',
              fontSize: '15px',
              outline: 'none',
            }}
          />
          <div style={{ fontSize: '11.5px', color: '#bbf7d0', lineHeight: '1.4' }}>
            {lang === 'ko'
              ? '스크롤을 맨 아래로 내린 뒤 이 인풋을 터치해도, 16px 안전 마진 정렬로 사파리 강제 스크롤을 사전에 회피하여 키보드가 안정적으로 열립니다.'
              : 'Scroll all the way down and tap this input. Safely evades Safari heuristics, smoothly nudging the input inside safe zone with 16px padding.'}
          </div>
        </div>

        <div style={{ height: '60px', flexShrink: 0 }} />
      </div>
    </SubpageLayoutV02>
  )
}

function Exp04ASandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [floatingVal, setFloatingVal] = useState('')
  const [bodyVal, setBodyVal] = useState('')
  const [bottomInputVal, setBottomInputVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [messages, setMessages] = useState<string[]>([])
  const [scrollY, setScrollY] = useState(0)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // EXP-04-A: Uses the current CSS-first package. State lives in SubpageLayout.css; the hook only
  // keeps a focused body input in the reading position while the keyboard opens and closes.
  const engine = useMobileKeyboard({ bodyRef })

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  return (
    <SubpageLayout
      keyboardEngine={engine}
      bodyRef={bodyRef}
      style={{ zIndex: 300 }}
      header={<LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />}
      footer={
        <FloatingInput
          value={floatingVal}
          onChange={setFloatingVal}
          onSubmit={handleSubmit}
          placeholder={lang === 'ko' ? 'Zero-Shift 키보드 테스트...' : 'Test zero-shift keyboard input...'}
          {...engine.floatingProps}
          isKeyboardOpen={engine.isKeyboardOpen}
        />
      }
    >
      <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />

        {/* Bottom edge input placed at the very end of the scroll container to demonstrate that the reading position is preserved in EXP-04-A */}
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          border: '2px solid rgba(34, 197, 94, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '16px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#4ade80' }}>
            🛡️ {lang === 'ko' ? '페이지 최하단 본문 인풋 (읽던 위치 유지)' : 'Very Bottom Page Input (Reading Position Preserved)'}
          </div>
          <input
            type="text"
            value={bottomInputVal}
            onChange={(e) => setBottomInputVal(e.target.value)}
            placeholder={lang === 'ko' ? '스크롤 맨 끝에서 터치 ➔ 읽던 위치 그대로...' : 'Tap at the bottom -> your reading position stays put...'}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: '44px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '2px solid #22c55e',
              backgroundColor: '#09090b',
              color: '#f4f4f5',
              fontSize: '15px',
              outline: 'none',
            }}
          />
          <div style={{ fontSize: '11.5px', color: '#bbf7d0', lineHeight: '1.4' }}>
            {lang === 'ko'
              ? '스크롤을 맨 아래로 내린 뒤 이 인풋을 터치해도, 키보드가 열리고 닫히는 동안 읽던 위치가 그대로 유지됩니다.'
              : 'Scroll all the way down and tap this input. Your reading position stays put while the keyboard opens and closes.'}
          </div>
        </div>

        <div style={{ height: '60px', flexShrink: 0 }} />
      </div>
    </SubpageLayout>
  )
}

/* ==========================================================================
   EXP-04-B — Unlocked Window Scroll (4B) ⇄ App Shell (4A), decided by focus

   4B: the document scrolls, so Safari collapses its URL bar (100lvh). Header and
       composer are fixed overlays.
   4A: while any text input inside has the focus, a fixed shell takes the screen and
       <main> becomes the scroller, with the keyboard inset reserved as padding.

   What decides the mode is focus, in CSS (:focus-within / :has()). The one thing CSS
   cannot do is carry the reading position from the document into the shell's own
   scroller, so JS does that once, at lock time. The document itself never moves:
   it is capped at "scroll position + one viewport" so Safari's keyboard pan has
   nowhere to go and its URL bar is left alone (which is what killed taps when the
   body was position: fixed), and nothing is written back on unlock. Measured on
   device (spike-lock A/B/C) before this was written; the keyboard cycles are driven
   in the iOS Simulator through Appium (see the PR).
   ========================================================================== */

const EXP04B_TEXT = {
  ko: {
    mode4B: '4B 윈도우 스크롤 (비활성)',
    mode4A: '4A App-Shell (키보드 활성)',
    collapsed: '🚀 4B 윈도우 스크롤: 사파리 주소창 100lvh 축소 상태!',
    scrollHint: '👇 아래로 스크롤하면 사파리 주소창이 축소됩니다',
    locked: '🔒 4A 활성: 헤더 0.0px 완전 고정 | 키보드 위 밀착',
    position: '스크롤 위치',
    urlBar: 'Safari 주소창',
    urlCollapsed: '100lvh 축소',
    formTitle: '🎮 본문 인풋 (터치 시 4A로 자동 전환 & 헤더 0.0px 고정)',
    bodyInputLabel: '본문 텍스트 인풋 (터치 즉시 타이핑 가능)',
    bodyInputPlaceholder: '터치하여 본문 인풋 테스트 (자동 4A 전환)...',
    datePicker: '네이티브 날짜 피커',
    feedTitle: '📜 스크롤 테스트용 긴 피드 (주소창 축소 유도)',
    feedItem: '아래로 스크롤할 때 사파리 주소창이 100lvh로 축소되는지 확인하세요.',
    bottomTitle: '🛡️ 페이지 최하단 본문 인풋 (터치 시 키보드 위 자동 전개)',
    bottomPlaceholder: '최하단 인풋 터치 ➔ 키보드 위로 스크롤 전개',
    bottomHint: '키보드 비활성 상태에서 이 인풋을 터치하면 자동으로 4A 모드로 전환되며 키보드 위로 안전하게 드러납니다.',
    floatingPlaceholder: '메시지 입력 (터치 시 4A App-Shell 자동 전환)...',
  },
  en: {
    mode4B: '4B window scroll (idle)',
    mode4A: '4A app shell (keyboard)',
    collapsed: '🚀 4B window scroll: Safari URL bar collapsed to 100lvh',
    scrollHint: '👇 Scroll down to collapse the Safari URL bar',
    locked: '🔒 4A active: header pinned at 0.0px | flush with the keyboard',
    position: 'Scroll position',
    urlBar: 'Safari URL bar',
    urlCollapsed: '100lvh collapsed',
    formTitle: '🎮 Body input (auto-switches to 4A, header pinned at 0.0px)',
    bodyInputLabel: 'Body text input (types immediately on tap)',
    bodyInputPlaceholder: 'Tap to test body focus (auto 4A)...',
    datePicker: 'Native date picker',
    feedTitle: '📜 Long feed for URL bar collapse testing',
    feedItem: 'Scroll down to verify Safari collapses its address bar.',
    bottomTitle: '🛡️ Very bottom page input (revealed above the keyboard)',
    bottomPlaceholder: 'Tap bottom input -> revealed above keyboard',
    bottomHint: 'Tap this input while the keyboard is closed: the page switches to 4A and the input is revealed above the keyboard.',
    floatingPlaceholder: 'Type message (auto-switches to 4A)...',
  },
} as const

const EXP04B_INPUT_SELECTOR = 'input, textarea, [contenteditable]'
/** How long after our pointerup focus the tap's own click may still arrive (~400ms measured worst case). */
const EXP04B_TAP_CLICK_WINDOW_MS = 600

const EXP04B_CSS = `
  /* The showcase locks html/body/#root for every other lab; this one hands the document to the browser. */
  html:has(.rmkl-exp04b-root) { height: auto; min-height: 100%; overflow-y: auto; overflow-x: hidden; }
  body:has(.rmkl-exp04b-root) { height: auto; min-height: 100%; overflow: visible; position: static; }
  #root:has(.rmkl-exp04b-root) { height: auto; min-height: 100%; }

  /* 4A lock. The cap is exactly "scroll position + one viewport" (published by JS at tap time), so the
     document keeps its offset yet has no room left for Safari's keyboard pan. Not position: fixed:
     that resets the offset and makes Safari re-expand its URL bar under the finger. */
  html:has(.rmkl-exp04b-root:focus-within) { overflow: hidden; }
  body:has(.rmkl-exp04b-root:focus-within) { height: var(--rmkl-lock-height); min-height: 0; overflow: hidden; }

  /* ---------------- 4B: document flow, fixed overlays ---------------- */
  .rmkl-exp04b-root {
    position: relative; width: 100%; min-height: 100%; box-sizing: border-box;
    background: #09090b; color: #f4f4f5;
    /* no double-tap-to-zoom arbitration: the click follows the tap in ~100ms instead of ~400ms */
    touch-action: manipulation;
  }
  .rmkl-exp04b-header { position: fixed; top: 0; left: 0; right: 0; z-index: 60; transform: translateZ(0); }
  .rmkl-exp04b-body-container {
    position: relative; width: 100%; box-sizing: border-box;
    padding-top: calc(53px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px) + 24px);
  }
  /* column-reverse: the end of the content is the scroll origin, so the keyboard inset keeps the
     newest content in view for free and the engine can hold a focused body input in place (04-A) */
  .rmkl-exp04b-body { display: flex; flex-direction: column-reverse; width: 100%; overflow: visible; }
  .rmkl-exp04b-body-inner {
    display: flex; flex-direction: column-reverse; gap: 14px; width: 100%; box-sizing: border-box;
    padding: 14px 16px 24px;
  }
  .rmkl-exp04b-footer {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; box-sizing: border-box;
    background: rgba(9, 9, 11, 0.94); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
    border-top: 1px solid #27272a;
  }

  /* ---------------- 4A: the shell, while an input inside has the focus ---------------- */
  .rmkl-exp04b-root:focus-within {
    position: fixed; inset: 0; width: 100%; height: 100%; overflow: hidden; touch-action: none; z-index: 200;
  }
  .rmkl-exp04b-root:focus-within .rmkl-exp04b-header { position: absolute; }
  .rmkl-exp04b-root:focus-within .rmkl-exp04b-body-container {
    position: absolute; inset: 0; height: 100%; display: flex; flex-direction: column; overflow: hidden;
    touch-action: none; padding-bottom: var(--rmkl-kb-inset, 0px);
  }
  .rmkl-exp04b-root:focus-within .rmkl-exp04b-body {
    flex: 1 1 0%; min-height: 0; overflow-y: auto; overflow-x: hidden;
    -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; touch-action: pan-y;
  }
  .rmkl-exp04b-root:focus-within .rmkl-exp04b-footer {
    position: relative; z-index: 40; flex-shrink: 0; background: rgba(9, 9, 11, 0.96);
    -webkit-backdrop-filter: none; backdrop-filter: none;
  }
  /* a focused body input owns the shell; the composer steps aside (04-A) */
  .rmkl-exp04b-root:has(.rmkl-exp04b-body :is(input, textarea):focus) .rmkl-exp04b-footer { display: none; }

  /* Mode copy lives in CSS too. Both variants are always in the DOM and take the same room, so
     switching never changes the content height under the scroller. */
  .rmkl-exp04b-only-4a { display: none; }
  .rmkl-exp04b-root:focus-within .rmkl-exp04b-only-4a { display: inline; }
  .rmkl-exp04b-root:focus-within .rmkl-exp04b-only-4b { display: none; }
  .rmkl-exp04b-hud { --rmkl-exp04b-accent: 96, 165, 250; --rmkl-exp04b-tint: 59, 130, 246; }
  .rmkl-exp04b-root:focus-within .rmkl-exp04b-hud { --rmkl-exp04b-accent: 74, 222, 128; --rmkl-exp04b-tint: 34, 197, 94; }
  .rmkl-exp04b-hud-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rmkl-exp04b-hud-status { min-height: 2.9em; }
`

function Exp04BSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const text = EXP04B_TEXT[lang === 'ko' ? 'ko' : 'en']
  const [floatingVal, setFloatingVal] = useState('')
  const [bodyVal, setBodyVal] = useState('')
  const [bottomInputVal, setBottomInputVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [messages, setMessages] = useState<string[]>([
    'Message 1: 아래로 스크롤하여 사파리 주소창 축소(100lvh)를 확인하세요.',
    'Message 2: 스크롤 중에는 4B 순수 윈도우 스크롤 모드로 자유롭게 탐색합니다.',
    'Message 3: 어느 인풋이든 터치하면 즉시 4A App-Shell로 자동 전환되어 헤더 0.0px 고정!',
    'Message 4: 키보드가 닫히면(포커스 아웃 시) 다시 자동으로 4B 윈도우 스크롤로 복귀합니다.',
  ])
  // for the header's gauge and the HUD; the header sits outside the scroller, and the HUD's
  // numbers are written straight into the DOM, so neither can change the content height
  const [windowScrollY, setWindowScrollY] = useState(0)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLElement | null>(null)
  const hudScrollYRef = useRef<HTMLElement | null>(null)
  const hudInnerHeightRef = useRef<HTMLElement | null>(null)
  const hudVvHeightRef = useRef<HTMLElement | null>(null)

  // Publishes --rmkl-kb / --rmkl-kb-inset and keeps a focused body input in place in the
  // column-reverse body. Its bodyProps/floatingProps are deliberately not spread and its top-lock is
  // off: both scroll the window to 0, and here the window has to stay where the reader left it.
  const engine = useMobileKeyboard({ bodyRef, lockDurationMs: 0 })

  // The one job CSS cannot do: carry the reading position into the shell's scroller, once per lock.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let lastScrollY = Math.round(window.scrollY)
    let pendingY: number | null = null

    const isLocked = () => root.contains(document.activeElement) && isKeyboardTextInput(document.activeElement)
    const publishLock = (y: number) => {
      document.documentElement.style.setProperty('--rmkl-lock-height', `${y + window.innerHeight}px`)
      pendingY = y
    }
    // while the document scrolls, remember where -- a lock that arrives without a tap needs it
    const handleScroll = () => {
      if (!isLocked()) lastScrollY = Math.round(window.scrollY)
    }
    // The TAP locks the shell, not the touch. Focusing at pointerdown swapped the layout in the
    // middle of a gesture -- a finger that touched an input and dragged then scrolled the frozen
    // document and the shell's <main> at once. iOS cancels the pointer when a drag begins, so a
    // pointerup on the input it went down on is a completed tap. It also puts our focus ~50ms
    // ahead of iOS's own (at click), so the keyboard's resize mostly lands after the click has.
    let armed: HTMLElement | null = null
    const inputOf = (e: Event) => {
      const target = e.target instanceof Element ? e.target.closest(EXP04B_INPUT_SELECTOR) : null
      return isKeyboardTextInput(target) ? (target as HTMLElement) : null
    }
    const handlePointerDown = (e: Event) => {
      armed = inputOf(e)
    }
    const handlePointerCancel = () => {
      armed = null
    }
    // The tap's own click still has to land; if the keyboard inset moved the content in between,
    // the mousedown synthesized at the original point would blur the input (the tap that died on
    // device). While that click is pending, a mousedown anywhere but the focused input is refused.
    let clickPendingUntil = 0
    const handlePointerUp = (e: Event) => {
      const input = inputOf(e)
      if (!input || input !== armed) return
      armed = null
      if (!isLocked()) publishLock(Math.round(window.scrollY))
      clickPendingUntil = performance.now() + EXP04B_TAP_CLICK_WINDOW_MS
      input.focus({ preventScroll: true })
    }
    const handleClick = () => {
      clickPendingUntil = 0
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (performance.now() >= clickPendingUntil) return
      const active = document.activeElement
      if (!(active instanceof HTMLElement) || !root.contains(active) || !isKeyboardTextInput(active)) return
      if (e.target !== active) e.preventDefault()
    }
    // After the flip: the shell's scroller exists now. Focus moving between inputs inside the shell
    // is not a new lock (relatedTarget says where it came from). Registered in the CAPTURE phase:
    // useMobileKeyboard listens for focusin on <main> to remember where a focused body input sits
    // and puts it back there when the box changes -- it has to see the input where the transfer
    // leaves it, or it rewinds the shell to the pre-transfer spot as the keyboard opens.
    const handleFocusIn = (e: FocusEvent) => {
      if (!isKeyboardTextInput(e.target)) return
      const from = e.relatedTarget
      if (from instanceof Node && root.contains(from) && isKeyboardTextInput(from)) return
      if (pendingY === null) publishLock(lastScrollY)
      const main = bodyRef.current
      // column-reverse: 0 is the end of the content; the document's offset from the top is
      // that far short of it
      if (main && pendingY !== null) main.scrollTop = pendingY - (main.scrollHeight - main.clientHeight)
      pendingY = null
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    root.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true })
    root.addEventListener('pointercancel', handlePointerCancel, { capture: true, passive: true })
    root.addEventListener('pointerup', handlePointerUp, { capture: true, passive: true })
    root.addEventListener('focusin', handleFocusIn, { capture: true })
    root.addEventListener('mousedown', handleMouseDown, { capture: true })
    root.addEventListener('click', handleClick, { capture: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      root.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      root.removeEventListener('pointercancel', handlePointerCancel, { capture: true })
      root.removeEventListener('pointerup', handlePointerUp, { capture: true })
      root.removeEventListener('focusin', handleFocusIn, { capture: true })
      root.removeEventListener('mousedown', handleMouseDown, { capture: true })
      root.removeEventListener('click', handleClick, { capture: true })
      document.documentElement.style.removeProperty('--rmkl-lock-height')
    }
  }, [])

  // Diagnostics: numbers go straight into the DOM, the mode copy is chosen by CSS
  useEffect(() => {
    let rafId: number | null = null
    const update = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const y = Math.round(window.scrollY)
        setWindowScrollY(y)
        const vv = window.visualViewport
        if (hudScrollYRef.current) hudScrollYRef.current.textContent = `${y}px`
        if (hudInnerHeightRef.current) hudInnerHeightRef.current.textContent = `${window.innerHeight}px`
        if (hudVvHeightRef.current) hudVvHeightRef.current.textContent = `${vv ? Math.round(vv.height) : window.innerHeight}px`
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    update()
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
    engine.scrollToBottom('smooth')
  }

  const urlBarCollapsed = windowScrollY > 30
  const inputStyle: CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #3f3f46',
    backgroundColor: '#09090b',
    color: '#f4f4f5',
    fontSize: '15px',
    outline: 'none',
  }
  const cardStyle: CSSProperties = {
    padding: '14px',
    borderRadius: '12px',
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }

  return (
    <div ref={rootRef} className="rmkl-exp04b-root">
      <style>{EXP04B_CSS}</style>

      <header className="rmkl-exp04b-header">
        <LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={windowScrollY} />
      </header>

      <div className="rmkl-exp04b-body-container">
        {/* flex-direction is also set inline so getComputedStyle reports it without a stylesheet cascade */}
        <main
          ref={bodyRef}
          className="rmkl-exp04b-body"
          style={{ display: 'flex', flexDirection: 'column-reverse' }}
        >
          {/* column-reverse: the sections are written bottom-up; the screen shows them top-down */}
          <div className="rmkl-exp04b-body-inner">
            <div style={{ height: '40px', flexShrink: 0 }} />

            {/* Very bottom body input */}
            <div style={{ ...cardStyle, backgroundColor: 'rgba(59, 130, 246, 0.12)', border: '2px solid rgba(59, 130, 246, 0.5)', marginTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa' }}>{text.bottomTitle}</div>
              <input
                type="text"
                value={bottomInputVal}
                onChange={(e) => setBottomInputVal(e.target.value)}
                placeholder={text.bottomPlaceholder}
                style={{ ...inputStyle, border: '2px solid #3b82f6' }}
              />
              <div style={{ fontSize: '11.5px', color: '#93c5fd', lineHeight: '1.4' }}>{text.bottomHint}</div>
            </div>

            {/* Long feed, so Safari has something to collapse its URL bar over */}
            <div style={{ ...cardStyle, padding: '12px', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa' }}>{text.feedTitle}</div>
              {Array.from({ length: 14 }).map((_, idx) => (
                <div key={idx} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#27272a', fontSize: '12.5px', color: '#d4d4d8', lineHeight: '1.4' }}>
                  <b>Item #{idx + 1}</b> — {text.feedItem}
                </div>
              ))}
            </div>

            <LabMessagesSection messages={messages} lang={lang} />
            <LabFindingDecisionSection lab={lab} lang={lang} />
            <LabEvaluationSection lab={lab} lang={lang} />

            {/* Body input + native date picker */}
            <div style={cardStyle}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa' }}>{text.formTitle}</div>
              <div style={{ minWidth: 0 }}>
                <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '4px' }}>{text.bodyInputLabel}</label>
                <input
                  type="text"
                  value={bodyVal}
                  onChange={(e) => setBodyVal(e.target.value)}
                  placeholder={text.bodyInputPlaceholder}
                  style={inputStyle}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={{ fontSize: '11px', color: '#71717a', display: 'block', marginBottom: '4px' }}>{text.datePicker}</label>
                <input
                  type="date"
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                  // iOS gives date inputs an intrinsic width a flex item will not shrink below
                  style={{ ...inputStyle, display: 'block', minWidth: 0, maxWidth: '100%', WebkitAppearance: 'none', appearance: 'none' }}
                />
              </div>
            </div>

            <LabHeroSection lab={lab} lang={lang} />

            {/* Diagnostics HUD. Mode copy and colours are picked by CSS; the numbers are written by JS. */}
            <div
              className="rmkl-exp04b-hud"
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(var(--rmkl-exp04b-tint), 0.12)',
                border: '1px solid rgba(var(--rmkl-exp04b-tint), 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div className="rmkl-exp04b-hud-line" style={{ fontWeight: 700, color: 'rgb(var(--rmkl-exp04b-accent))', fontSize: '13px' }}>
                  📊 EXP-04-B: <span className="rmkl-exp04b-only-4b">{text.mode4B}</span>
                  <span className="rmkl-exp04b-only-4a">{text.mode4A}</span>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgb(var(--rmkl-exp04b-tint))', color: '#ffffff', fontSize: '10.5px', fontWeight: 700, flexShrink: 0 }}>
                  <span className="rmkl-exp04b-only-4b">4B NATIVE</span>
                  <span className="rmkl-exp04b-only-4a">4A LOCKED</span>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: '#cbd5e1' }}>
                <div className="rmkl-exp04b-hud-line">{text.position}: <b ref={hudScrollYRef} style={{ color: '#facc15' }}>{windowScrollY}px</b></div>
                <div className="rmkl-exp04b-hud-line">innerHeight: <b ref={hudInnerHeightRef}>-</b></div>
                <div className="rmkl-exp04b-hud-line">vv.height: <b ref={hudVvHeightRef}>-</b></div>
                <div className="rmkl-exp04b-hud-line">
                  {text.urlBar}: <b style={{ color: urlBarCollapsed ? '#4ade80' : '#facc15' }}>{urlBarCollapsed ? text.urlCollapsed : '100svh'}</b>
                </div>
              </div>
              <div className="rmkl-exp04b-hud-status" style={{ fontSize: '11px', color: 'rgb(var(--rmkl-exp04b-accent))', marginTop: '2px' }}>
                <span className="rmkl-exp04b-only-4b">{urlBarCollapsed ? text.collapsed : text.scrollHint}</span>
                <span className="rmkl-exp04b-only-4a">{text.locked}</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="rmkl-exp04b-footer">
          <FloatingInput
            value={floatingVal}
            onChange={setFloatingVal}
            onSubmit={handleSubmit}
            placeholder={text.floatingPlaceholder}
            isKeyboardOpen={engine.isKeyboardOpen}
          />
        </footer>
      </div>
    </div>
  )
}

/* ==========================================================================
   Main Sandbox Dispatcher
   ========================================================================== */

export const LabSandbox = ({ lab, lang, onClose }: LabSandboxProps) => {
  switch (lab.id) {
    case 'exp01_a':
      return <Exp01ASandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp01_b':
      return <Exp01BSandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp01_c':
      return <Exp01CSandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp01_d':
      return <Exp01DSandbox lab={lab} lang={lang} onClose={onClose} />
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
      return <Exp03DSandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp03_e':
      return <Exp03ESandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp03_f':
      return <Exp03FSandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp04_a':
      return <Exp04ASandbox lab={lab} lang={lang} onClose={onClose} />
    case 'exp04_b':
      return <Exp04BSandbox lab={lab} lang={lang} onClose={onClose} />
    default:
      return <Exp04ASandbox lab={lab} lang={lang} onClose={onClose} />
  }
}

