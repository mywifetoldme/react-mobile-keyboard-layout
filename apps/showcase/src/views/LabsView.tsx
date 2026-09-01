import { useState, useRef, type ReactNode } from 'react'
import { SubpageLayout } from 'react-mobile-keyboard-layout'
import { LABS_DATA, type LabInfo } from '../data/labsData'
import { translations, type Language } from '../i18n'

interface LabsViewProps {
  lang: Language
  header?: ReactNode
}

export const LabsView = ({ lang, header }: LabsViewProps) => {
  const t = translations[lang]
  const [selectedLab, setSelectedLab] = useState<LabInfo | null>(null)
  const [sandboxInput, setSandboxInput] = useState('')
  const [sandboxBodyInput, setSandboxBodyInput] = useState('')
  const sandboxScrollRef = useRef<HTMLDivElement | null>(null)

  const getStatusBadge = (status: LabInfo['status']) => {
    switch (status) {
      case 'winner':
        return { text: t.badgeWinner, bg: '#22c55e', color: '#052e16' }
      case 'progress':
        return { text: t.badgeProgress, bg: '#3b82f6', color: '#ffffff' }
      case 'failed':
        return { text: t.badgeFailed, bg: '#ef4444', color: '#ffffff' }
    }
  }

  // Render Full-Screen Isolated Sandbox when a lab is opened
  if (selectedLab) {
    const badge = getStatusBadge(selectedLab.status)
    const isWinner = selectedLab.status === 'winner'

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Sandbox Top Bar */}
        <header style={{
          height: '56px',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          backgroundColor: '#18181b',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '12px',
          paddingRight: '12px',
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={() => setSelectedLab(null)}
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
            {t.backToLabs}
          </button>

          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5' }}>
            {selectedLab.id.toUpperCase().replace('_', '-')}
          </div>

          <span style={{
            padding: '3px 8px',
            borderRadius: '6px',
            backgroundColor: badge.bg,
            color: badge.color,
            fontSize: '11px',
            fontWeight: 700,
          }}>
            {badge.text}
          </span>
        </header>

        {/* Experiment Context Card */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: isWinner ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.08)',
          borderBottom: `1px solid ${isWinner ? '#22c55e' : '#3b82f6'}`,
          flexShrink: 0,
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: isWinner ? '#4ade80' : '#60a5fa' }}>
            {selectedLab.title[lang]}
          </h3>
          <p style={{ fontSize: '12px', color: '#d4d4d8', marginBottom: '6px', lineHeight: '1.4' }}>
            <strong>{t.hypothesisLabel}: </strong>{selectedLab.description[lang]}
          </p>
          <p style={{ fontSize: '12px', color: isWinner ? '#86efac' : '#93c5fd', lineHeight: '1.4' }}>
            <strong>{t.keyFindingLabel}: </strong>{selectedLab.keyFinding[lang]}
          </p>
        </div>

        {/* Sandbox Interactive Scrollable Body */}
        <main
          ref={sandboxScrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Test Form Input inside Sandbox */}
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
          }}>
            <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
              Sandbox Body Input
            </label>
            <input
              type="text"
              value={sandboxBodyInput}
              onChange={(e) => setSandboxBodyInput(e.target.value)}
              placeholder="Type inside body..."
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

          {/* Test Content Items */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid #27272a',
                fontSize: '13px',
                color: '#d4d4d8',
                lineHeight: '1.4',
              }}
            >
              #{i + 1} — {selectedLab.title[lang]} isolated test row. Tap the inputs to test keyboard interaction under this experiment model.
            </div>
          ))}
        </main>

        {/* Sandbox Floating Input Bar */}
        <footer style={{
          padding: '8px 16px calc(8px + env(safe-area-inset-bottom, 0px))',
          backgroundColor: '#18181b',
          borderTop: '1px solid #27272a',
          flexShrink: 0,
        }}>
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
              value={sandboxInput}
              onChange={(e) => setSandboxInput(e.target.value)}
              placeholder="Test sandbox input..."
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
              onClick={() => setSandboxInput('')}
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
              Test
            </button>
          </div>
        </footer>
      </div>
    )
  }

  // Default Labs List View
  return (
    <SubpageLayout header={header} title={t.labsArchiveTitle}>
      <div style={{ padding: '16px 16px 36px' }}>
        <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '16px', lineHeight: '1.5' }}>
          {t.labsArchiveSubtitle}
        </p>

        {/* Labs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {LABS_DATA.map((lab) => {
            const badge = getStatusBadge(lab.status)
            const isWinner = lab.status === 'winner'

            return (
              <div
                key={lab.id}
                onClick={() => setSelectedLab(lab)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: isWinner ? '1px solid #22c55e' : '1px solid #27272a',
                  backgroundColor: isWinner ? 'rgba(34, 197, 94, 0.06)' : '#18181b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: isWinner ? '#4ade80' : '#f4f4f5' }}>
                    {lab.title[lang]}
                  </h3>
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: badge.bg,
                    color: badge.color,
                    fontSize: '10px',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}>
                    {badge.text}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '1.4' }}>
                  {lab.description[lang]}
                </p>

                <div style={{
                  fontSize: '12px',
                  color: isWinner ? '#22c55e' : '#60a5fa',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                }}>
                  {t.launchSandbox}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SubpageLayout>
  )
}
