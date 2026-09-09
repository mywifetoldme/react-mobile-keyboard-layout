import { useState, useEffect, useRef, useCallback, type CSSProperties, type RefObject, type PointerEvent as ReactPointerEvent } from 'react'
import type { Language } from '../i18n'
import {
  type LabSandboxProps,
  LabHeader,
  LabHeroSection,
  LabEvaluationSection,
  LabFindingDecisionSection,
  LabMessagesSection,
} from './labSections'
import { Exp04BSandbox } from '../labs/Exp04BSandbox'
import {
  SubpageLayout,
  FloatingInput,
  isKeyboardTextInput,
} from 'react-mobile-keyboard-layout'

// EXP-03-F is frozen at v0.2.0 (03c867d0). It runs on an isolated copy of the old
// engine under ../labs/engine-v0.2 so the current package can evolve freely.
import {
  SubpageLayout as SubpageLayoutV02,
  FloatingInput as FloatingInputV02,
  useMobileKeyboard as useMobileKeyboardV02,
} from '../labs/engine-v0.2'
// EXP-04-A and EXP-04-B run on a frozen copy of the v1.0 engine (../labs/engine-v1.0) for the
// same reason, so the package can keep moving without rewriting what those two labs showed.
import {
  SubpageLayout as SubpageLayoutV10,
  FloatingInput as FloatingInputV10,
  useMobileKeyboard as useMobileKeyboardV10,
} from '../labs/engine-v1.0'


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

  // EXP-04-A: Runs on the frozen v1.0 engine copy (CSS-first). State lives in SubpageLayout.css; the hook only
  // keeps a focused body input in the reading position while the keyboard opens and closes.
  const engine = useMobileKeyboardV10({ bodyRef })

  const handleSubmit = () => {
    if (!floatingVal.trim()) return
    setMessages((prev) => [...prev, floatingVal.trim()])
    setFloatingVal('')
  }

  return (
    <SubpageLayoutV10
      keyboardEngine={engine}
      bodyRef={bodyRef}
      style={{ zIndex: 300 }}
      header={<LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={scrollY} />}
      footer={
        <FloatingInputV10
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
    </SubpageLayoutV10>
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

