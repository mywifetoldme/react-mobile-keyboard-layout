/* ==========================================================================
   EXP-04-B — Unlocked Window Scroll (4B) ⇄ App Shell (4A), decided by focus

   The state machine lives in the platform: the state is the focus, the transitions are the
   browser's focus events, and "applying" a state is the CSS cascade. This file only adds what
   CSS cannot express, and this table is the map of the whole thing.

   STATE       decided by            layout (CSS below)                        JS
   ─────────── ───────────────────── ───────────────────────────────────────── ───────────────────────────────
   4B  idle    :not(:focus-within)   document scrolls; header and composer     publish --rmkl-lock-height =
                                     are fixed overlays (z-index)              scrollY + innerHeight as it moves
   4A  locked  :focus-within         body capped + frozen; the shell takes     on entry: republish the cap from
                                     the screen; <main> scrolls; the composer  the live offset, hand that offset
                                     sits on the keyboard inset                to <main> once (useDocumentHandoff)

   TRANSITION       event                         handled by
   ──────────────── ───────────────────────────── ──────────────────────────────────────────────
   tap armed        pointerdown on a text input   useTapToFocus — arm only, no focus yet
   tap cancelled    pointercancel (a drag)        useTapToFocus — a scroll never locks
   4B → 4A          pointerup on the same input   useTapToFocus focus() → the CSS flips
   click pending    pointerup … click (≤ 600ms)   useTapToFocus refuses a stray mousedown
   4A → 4B          focusout                      the CSS flips; nothing is written back

   Why the document is capped rather than position: fixed, and why the tap needs protecting, is
   written next to each rule. Every row above was measured on an iPhone before it was written.
   ========================================================================== */

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
// EXP-04-B runs on a frozen copy of the engine (see ./engine-v1.0/README.md), so it keeps
// showing what it showed no matter how the package evolves.
import { FloatingInput, useMobileKeyboard, isKeyboardTextInput, KEYBOARD_INSET_CSS_VAR } from './engine-v1.0'
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
    touch-action: none; padding-bottom: var(${KEYBOARD_INSET_CSS_VAR}, 0px);
  }
  .rmkl-exp04b-root:focus-within .rmkl-exp04b-body {
    flex: 1 1 0%; min-height: 0; overflow-y: auto; overflow-x: hidden;
    -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; touch-action: pan-y;
  }
  .rmkl-exp04b-root:focus-within .rmkl-exp04b-footer {
    position: relative; z-index: 40; flex-shrink: 0; background: rgba(9, 9, 11, 0.96);
    -webkit-backdrop-filter: none; backdrop-filter: none;
    /* a drag on the bar must not become a document scroll: overflow: hidden does not stop touch */
    touch-action: none;
  }
  /* the textarea scrolls its own lines; when they end, the gesture must not chain into the document */
  .rmkl-exp04b-root:focus-within .rmkl-exp04b-footer textarea { touch-action: pan-y; overscroll-behavior: contain; }
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


const EXP04B_INPUT_SELECTOR = 'input, textarea, [contenteditable]'
/** How long after our pointerup focus the tap's own click may still arrive (~400ms measured worst case). */
const EXP04B_TAP_CLICK_WINDOW_MS = 600
/** The document's height while locked: the reader's offset plus one viewport. Read by the CSS above. */
const LOCK_HEIGHT_CSS_VAR = '--rmkl-lock-height'

const keyboardInputOf = (target: EventTarget | null): HTMLElement | null => {
  const el = target instanceof Element ? target.closest(EXP04B_INPUT_SELECTOR) : null
  return isKeyboardTextInput(el) ? (el as HTMLElement) : null
}
const focusedInputInside = (root: HTMLElement): HTMLElement | null => {
  const active = document.activeElement
  return active instanceof HTMLElement && root.contains(active) && isKeyboardTextInput(active) ? active : null
}

/**
 * The TAP locks the shell, not the touch.
 *
 * pointerdown only arms the input under the finger; pointerup on that same input focuses it.
 * Focusing at pointerdown swapped the layout in the middle of a gesture -- a finger that touched
 * an input and dragged then scrolled the frozen document and the shell's <main> at once. iOS
 * cancels the pointer when a drag begins, so a scroll never locks. Focusing at pointerup also
 * puts us ~50ms ahead of iOS's own focus (at click), so the keyboard's resize mostly lands after
 * the click has.
 *
 * The tap's own click still has to land. If the keyboard inset moved the content in between, the
 * mousedown synthesized at the original point would blur the input (7/7 taps on the bottom input
 * died that way on device). While that click is pending, a mousedown anywhere but the focused
 * input is refused.
 */
function useTapToFocus(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let armed: HTMLElement | null = null
    let clickPendingUntil = 0

    const onPointerDown = (e: Event) => {
      armed = keyboardInputOf(e.target)
    }
    const onPointerCancel = () => {
      armed = null
    }
    const onPointerUp = (e: Event) => {
      const input = keyboardInputOf(e.target)
      if (!input || input !== armed) return
      armed = null
      clickPendingUntil = performance.now() + EXP04B_TAP_CLICK_WINDOW_MS
      input.focus({ preventScroll: true })
    }
    const onClick = () => {
      clickPendingUntil = 0
    }
    const onMouseDown = (e: MouseEvent) => {
      if (performance.now() >= clickPendingUntil) return
      const focused = focusedInputInside(root)
      if (focused && e.target !== focused) e.preventDefault()
    }

    root.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
    root.addEventListener('pointercancel', onPointerCancel, { capture: true, passive: true })
    root.addEventListener('pointerup', onPointerUp, { capture: true, passive: true })
    root.addEventListener('mousedown', onMouseDown, { capture: true })
    root.addEventListener('click', onClick, { capture: true })
    return () => {
      root.removeEventListener('pointerdown', onPointerDown, { capture: true })
      root.removeEventListener('pointercancel', onPointerCancel, { capture: true })
      root.removeEventListener('pointerup', onPointerUp, { capture: true })
      root.removeEventListener('mousedown', onMouseDown, { capture: true })
      root.removeEventListener('click', onClick, { capture: true })
    }
  }, [rootRef])
}

/**
 * The one job CSS cannot do: carry the reader's position from the document into the shell.
 *
 * While the document scrolls, its offset plus one viewport is published as a CSS variable, the
 * way the engine publishes the keyboard height. So when focus arrives the cap is already in place and the
 * flip to 4A leaves the document exactly where it was (position: fixed would reset it to 0 and
 * make Safari re-expand its URL bar under the finger). On entry the cap is republished from the
 * live offset and that offset is handed to <main> once. Focus moving between inputs inside the
 * shell is not a new entry. Nothing is written back on the way out: the document never moved.
 *
 * Capture phase on purpose: useMobileKeyboard listens for focusin on <main> to remember where a
 * focused body input sits; it has to see the input where the transfer leaves it.
 */
function useDocumentHandoff(rootRef: RefObject<HTMLElement | null>, bodyRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const publishCap = () => {
      document.documentElement.style.setProperty(LOCK_HEIGHT_CSS_VAR, `${Math.round(window.scrollY) + window.innerHeight}px`)
    }
    const onScroll = () => {
      if (!focusedInputInside(root)) publishCap()
    }
    const onFocusIn = (e: FocusEvent) => {
      if (!isKeyboardTextInput(e.target)) return
      const from = e.relatedTarget
      if (from instanceof Node && root.contains(from) && isKeyboardTextInput(from)) return
      publishCap()
      const main = bodyRef.current
      if (!main) return
      // column-reverse: 0 is the end of the content; the document's offset from the top is that far short of it
      main.scrollTop = Math.round(window.scrollY) - (main.scrollHeight - main.clientHeight)
    }

    publishCap()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    root.addEventListener('focusin', onFocusIn, { capture: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      root.removeEventListener('focusin', onFocusIn, { capture: true })
      document.documentElement.style.removeProperty(LOCK_HEIGHT_CSS_VAR)
    }
  }, [rootRef, bodyRef])
}

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

  const rootRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLElement | null>(null)
  const hudScrollYRef = useRef<HTMLElement | null>(null)
  const hudInnerHeightRef = useRef<HTMLElement | null>(null)
  const hudVvHeightRef = useRef<HTMLElement | null>(null)

  // Publishes the keyboard height/inset variables and keeps the reading position in the column-reverse body.
  // Its bodyProps/floatingProps are deliberately not spread and its top-lock is off: both scroll the
  // window to 0, and here the window has to stay where the reader left it.
  const engine = useMobileKeyboard({ bodyRef, lockDurationMs: 0 })
  useTapToFocus(rootRef)
  useDocumentHandoff(rootRef, bodyRef)
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
