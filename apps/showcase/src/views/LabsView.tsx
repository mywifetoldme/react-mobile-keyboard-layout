import { useState, type ReactNode } from 'react'
import { SubpageLayout } from 'react-mobile-keyboard-layout'
import { LABS_DATA, type LabInfo } from '../data/labsData'
import { translations, type Language } from '../i18n'

export const LabsView = ({ lang, header }: { lang: Language; header?: ReactNode }) => {
  const t = translations[lang]
  const [selectedLab, setSelectedLab] = useState<LabInfo>(LABS_DATA[LABS_DATA.length - 1])

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

  return (
    <SubpageLayout header={header} title={t.labsArchiveTitle}>
      <div style={{ padding: '16px 16px 32px' }}>
        <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '16px', lineHeight: '1.5' }}>
          {t.labsArchiveSubtitle}
        </p>

        {/* Selected Lab Spotlight */}
        <div style={{
          padding: '16px',
          borderRadius: '14px',
          backgroundColor: selectedLab.status === 'winner' ? 'rgba(34, 197, 94, 0.1)' : '#18181b',
          border: `1px solid ${selectedLab.status === 'winner' ? '#22c55e' : '#3f3f46'}`,
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>
              {selectedLab.title[lang]}
            </h3>
            {(() => {
              const badge = getStatusBadge(selectedLab.status)
              return (
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: badge.bg,
                  color: badge.color,
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  {badge.text}
                </span>
              )
            })()}
          </div>

          <div style={{ fontSize: '13px', color: '#d4d4d8', marginBottom: '12px' }}>
            <strong style={{ color: '#a1a1aa' }}>{t.hypothesisLabel}: </strong>
            {selectedLab.description[lang]}
          </div>

          <div style={{
            fontSize: '13px',
            color: '#60a5fa',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            padding: '10px 12px',
            borderRadius: '8px',
          }}>
            <strong>{t.keyFindingLabel}: </strong>
            {selectedLab.keyFinding[lang]}
          </div>
        </div>

        {/* Lab Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {LABS_DATA.map((lab) => {
            const isSelected = selectedLab.id === lab.id
            const badge = getStatusBadge(lab.status)
            return (
              <button
                key={lab.id}
                type="button"
                onClick={() => setSelectedLab(lab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid #27272a',
                  backgroundColor: isSelected ? '#27272a' : '#18181b',
                  color: '#f4f4f5',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
              >
                <span style={{ fontWeight: isSelected ? 600 : 400 }}>
                  {lab.title[lang]}
                </span>
                <span style={{
                  padding: '2px 6px',
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
              </button>
            )
          })}
        </div>
      </div>
    </SubpageLayout>
  )
}
