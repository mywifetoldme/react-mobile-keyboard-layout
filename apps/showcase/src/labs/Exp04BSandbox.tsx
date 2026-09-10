/* ==========================================================================
   EXP-04-B — Unlocked Window Scroll (4B) ⇄ App Shell (4A), decided by focus

   This lab renders the library's PageLayout from the frozen engine copy (./engine-v1.0), so the
   lab and the library are one code until 4B is concluded; the copy is refreshed as findings land.
   The mechanism -- state in CSS, one hand-off in JS, the tap protected -- is documented, with its
   state/transition table, at the top of engine-v1.0/components/PageLayout.tsx. What this file
   owns is the experiment: the HUD, the content that exercises the layout, and the record.
   ========================================================================== */

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { PageLayout, FloatingInput, usePageKeyboard } from './engine-v1.0'
import {
  type LabSandboxProps,
  LabHeader,
  LabHeroSection,
  LabEvaluationSection,
  LabFindingDecisionSection,
  LabMessagesSection,
} from '../components/labSections'

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


/** The copy's shell selector (engine-v1.0 rewrites the rmkl- prefix to rmkl-v10-): the HUD reads the mode from it.
 *  The shell is keyed to one attribute the tap sets before focusing, not to :focus -- see PageLayout.tsx in the copy. */
export const EXP04B_SHELL = '.rmkl-v10-page-root[data-rmkl-v10-shell]'

const EXP04B_CSS = `
  /* Mode copy lives in CSS. Both variants are always in the DOM and take the same room, so
     switching never changes the content height under the scroller. */
  .rmkl-exp04b-only-4a { display: none; }
  ${EXP04B_SHELL} .rmkl-exp04b-only-4a { display: inline; }
  ${EXP04B_SHELL} .rmkl-exp04b-only-4b { display: none; }
  .rmkl-exp04b-hud { --rmkl-exp04b-accent: 96, 165, 250; --rmkl-exp04b-tint: 59, 130, 246; }
  ${EXP04B_SHELL} .rmkl-exp04b-hud { --rmkl-exp04b-accent: 74, 222, 128; --rmkl-exp04b-tint: 34, 197, 94; }
  .rmkl-exp04b-hud-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rmkl-exp04b-hud-status { min-height: 2.9em; }
  .rmkl-exp04b-content { padding: 14px 16px 24px; display: flex; flex-direction: column; gap: 14px; }
`

/** Diagnostics: the numbers go straight into the DOM; the mode copy is chosen by CSS. */
function useScrollGauge(refs: {
  scrollY: RefObject<HTMLElement | null>
  innerHeight: RefObject<HTMLElement | null>
  vvHeight: RefObject<HTMLElement | null>
}) {
  const [windowScrollY, setWindowScrollY] = useState(0)
  useEffect(() => {
    let rafId: number | null = null
    const update = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const y = Math.round(window.scrollY)
        setWindowScrollY(y)
        const vv = window.visualViewport
        if (refs.scrollY.current) refs.scrollY.current.textContent = `${y}px`
        if (refs.innerHeight.current) refs.innerHeight.current.textContent = `${window.innerHeight}px`
        if (refs.vvHeight.current) refs.vvHeight.current.textContent = `${vv ? Math.round(vv.height) : window.innerHeight}px`
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
  }, [refs.scrollY, refs.innerHeight, refs.vvHeight])
  return windowScrollY
}

export function Exp04BSandbox({ lab, lang, onClose }: LabSandboxProps) {
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

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const hudScrollYRef = useRef<HTMLElement | null>(null)
  const hudInnerHeightRef = useRef<HTMLElement | null>(null)
  const hudVvHeightRef = useRef<HTMLElement | null>(null)
  // PageLayout keeps the window where the reader left it; the hook's top-lock (which scrolls it to 0) is off
  const engine = usePageKeyboard({ bodyRef })
  const windowScrollY = useScrollGauge({ scrollY: hudScrollYRef, innerHeight: hudInnerHeightRef, vvHeight: hudVvHeightRef })

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
    <PageLayout
      className="rmkl-exp04b-root"
      bodyRef={bodyRef}
      header={<LabHeader lab={lab} lang={lang} onClose={onClose} windowScrollY={windowScrollY} />}
      footer={
        <FloatingInput
          value={floatingVal}
          onChange={setFloatingVal}
          onSubmit={handleSubmit}
          placeholder={text.floatingPlaceholder}
          isKeyboardOpen={engine.isKeyboardOpen}
        />
      }
    >
      <style>{EXP04B_CSS}</style>
      <div className="rmkl-exp04b-content">
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
          

            <LabHeroSection lab={lab} lang={lang} />

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

            <LabMessagesSection messages={messages} lang={lang} />
            <LabFindingDecisionSection lab={lab} lang={lang} />
            <LabEvaluationSection lab={lab} lang={lang} />

            {/* Long feed, so Safari has something to collapse its URL bar over */}
            <div style={{ ...cardStyle, padding: '12px', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#a1a1aa' }}>{text.feedTitle}</div>
              {Array.from({ length: 14 }).map((_, idx) => (
                <div key={idx} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#27272a', fontSize: '12.5px', color: '#d4d4d8', lineHeight: '1.4' }}>
                  <b>Item #{idx + 1}</b> — {text.feedItem}
                </div>
              ))}
            </div>

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

            <div style={{ height: '40px', flexShrink: 0 }} />
      </div>
    </PageLayout>
  )
}
