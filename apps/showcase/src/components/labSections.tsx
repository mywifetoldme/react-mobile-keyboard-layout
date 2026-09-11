import type { LabInfo, EvaluationItem } from '../data/labsData'
import type { Language } from '../i18n'

export interface LabSandboxProps {
  lab: LabInfo
  lang: Language
  onClose: () => void
}

/* ==========================================================================
   Shared Evaluation Badge & Section Components
   ========================================================================== */

/** `exp04_b` -> `EXP-04-B`, the code every lab is referred to by. */
export const labCode = (lab: LabInfo) => lab.id.replace(/^exp(\d+)_([a-z])$/i, (_, n, l) => `EXP-${n}-${l.toUpperCase()}`)

/** Every criterion met -- the FINAL of the series or a winner of its era (superseded since). */
const passedAll = (lab: LabInfo) => lab.status === 'winner' || lab.status === 'passed'
const STATUS_BADGE: Record<LabInfo['status'], { text: string; bg: string }> = {
  winner: { text: 'FINAL', bg: '#22c55e' },
  passed: { text: 'PASSED', bg: '#0f766e' },
  progress: { text: 'PROGRESS', bg: '#3b82f6' },
  failed: { text: 'FAILED', bg: '#ef4444' },
}

export const StatusBadge = ({ status, lang }: { status: EvaluationItem['status']; lang: Language }) => {
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

export const LabHeroSection = ({ lab, lang }: { lab: LabInfo; lang: Language }) => (
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

export const LabEvaluationSection = ({ lab, lang }: { lab: LabInfo; lang: Language }) => {
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

export const LabFindingDecisionSection = ({ lab, lang }: { lab: LabInfo; lang: Language }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {/* Key Finding */}
    <div style={{
      padding: '12px',
      borderRadius: '12px',
      backgroundColor: passedAll(lab) ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
      border: `1px solid ${passedAll(lab) ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: passedAll(lab) ? '#4ade80' : '#f87171',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        🔍 {lang === 'ko' ? '실기기 관찰 결과' : 'On-Device Finding'}
      </div>
      <div style={{
        fontSize: '12px',
        color: passedAll(lab) ? '#bbf7d0' : '#fca5a5',
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

export const LabMessagesSection = ({ messages, lang }: { messages: string[]; lang: Language }) => (
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

export const LabHeader = ({ lab, lang, onClose, windowScrollY }: { lab: LabInfo; lang: Language; onClose: () => void; windowScrollY: number }) => (
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
        {labCode(lab)}
      </div>
    </div>

    <span style={{
      padding: '3px 8px',
      borderRadius: '6px',
      backgroundColor: STATUS_BADGE[lab.status].bg,
      color: '#ffffff',
      fontSize: '11px',
      fontWeight: 700,
    }}>
      {STATUS_BADGE[lab.status].text}
    </span>
  </header>
)
