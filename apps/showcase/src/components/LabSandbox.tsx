import { useState, useEffect, useRef, useCallback, type CSSProperties, type RefObject } from 'react'
import type { LabInfo, EvaluationItem } from '../data/labsData'
import type { Language } from '../i18n'
import {
  SubpageLayout,
  FloatingInput,
  useMobileKeyboard,
  isKeyboardTextInput,
} from 'react-mobile-keyboard-layout'

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
   13. EXP-03-E: FINAL (Atomic Viewport Restoration & Dismiss Sync)
   ========================================================================== */

function Exp03ESandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [floatingVal, setFloatingVal] = useState('')
  const [bodyVal, setBodyVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [messages, setMessages] = useState<string[]>([])
  const [scrollY, setScrollY] = useState(0)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const engine = useMobileKeyboard({
    bodyRef,
  })

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
        />
      }
    >
      <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <LabHeroSection lab={lab} lang={lang} />
        <LabFormSection lang={lang} bodyVal={bodyVal} setBodyVal={setBodyVal} dateVal={dateVal} setDateVal={setDateVal} />
        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />
        <div style={{ height: '40px', flexShrink: 0 }} />
      </div>
    </SubpageLayout>
  )
}

/* ==========================================================================
   14. EXP-03-F: WINNER (In-Viewport Boundary Evasion)
   ========================================================================== */

function Exp03FSandbox({ lab, lang, onClose }: LabSandboxProps) {
  const [floatingVal, setFloatingVal] = useState('')
  const [bottomInputVal, setBottomInputVal] = useState('')
  const [enableAlignment, setEnableAlignment] = useState(true)
  const [messages, setMessages] = useState<string[]>([
    lang === 'ko' ? '스크롤을 아래로 끝까지 내려서 최하단 인풋을 터치해보세요.' : 'Scroll down to the bottom and focus the bottom-most input.',
    lang === 'ko' ? '사파리 기본 동작은 최하단 인풋을 억지로 화면 중앙으로 끌어올리려다 키보드와 충돌합니다.' : 'Safari natively tries to yank bottom inputs into center view, fighting viewport controls.',
    lang === 'ko' ? '16px 안전 여백 정렬(회피 로직)이 활성화되면 키보드가 솟아오르다 내려가는 현상이 사라집니다.' : 'With 16px boundary evasion active, the keyboard ascends smoothly without bouncing down.',
  ])
  const [scrollY, setScrollY] = useState(0)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const engine = useMobileKeyboard({
    bodyRef,
  })

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
        />
      }
    >
      <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <LabHeroSection lab={lab} lang={lang} />

        {/* Boundary Evasion Mode Switcher */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: '#18181b',
          border: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f4f4f5' }}>
              {lang === 'ko' ? '16px 뷰포트 경계 회피 로직' : '16px Boundary Evasion Logic'}
            </div>
            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
              {lang === 'ko' ? '사파리 개입 조건을 원천 차단' : 'Eliminates Safari collision triggers'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnableAlignment((prev) => !prev)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: enableAlignment ? '#15803d' : '#3f3f46',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {enableAlignment ? (lang === 'ko' ? '활성화 (ON)' : 'ACTIVE (ON)') : (lang === 'ko' ? '비활성화 (OFF)' : 'DISABLED (OFF)')}
          </button>
        </div>

        <LabEvaluationSection lab={lab} lang={lang} />
        <LabFindingDecisionSection lab={lab} lang={lang} />
        <LabMessagesSection messages={messages} lang={lang} />

        {/* Dedicated Bottom-of-Container Form Card */}
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          backgroundColor: '#18181b',
          border: '1px solid #27272a',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '16px',
          marginBottom: '32px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>
            📍 {lang === 'ko' ? '컨테이너 최하단 인풋 테스트 영역' : 'Bottom-of-Container Target Input'}
          </div>
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0, lineHeight: '1.4' }}>
            {lang === 'ko'
              ? '이 인풋은 스크롤 영역의 가장 밑바닥에 위치합니다. 터치하여 키보드가 솟아오를 때 튕김이나 흔들림 없이 매끄럽게 안착하는지 확인하세요.'
              : 'This input sits at the very bottom boundary. Focus it to verify zero keyboard-bounce or viewport jitter.'}
          </p>
          <input
            type="text"
            value={bottomInputVal}
            onChange={(e) => setBottomInputVal(e.target.value)}
            placeholder={lang === 'ko' ? '최하단 인풋 터치하여 테스트...' : 'Tap bottom input to test...'}
            onFocus={(e) => {
              if (enableAlignment) {
                // Emulates the 16px safe boundary alignment
                const target = e.currentTarget
                setTimeout(() => {
                  target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                }, 50)
              }
            }}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#09090b',
              border: '1px solid #3f3f46',
              color: '#f4f4f5',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      </div>
    </SubpageLayout>
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
    default:
      return <Exp03FSandbox lab={lab} lang={lang} onClose={onClose} />
  }
}
