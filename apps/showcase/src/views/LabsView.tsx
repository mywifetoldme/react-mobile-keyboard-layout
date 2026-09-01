import { useState } from 'react'
import { SubpageLayout } from 'react-mobile-keyboard-layout'
import { LABS_DATA, type LabInfo } from '../data/labsData'
import { translations, type Language } from '../i18n'

export const LabsView = ({ lang }: { lang: Language }) => {
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
    <SubpageLayout title={t.labsArchiveTitle}>
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
                  padding: '3px 8px',
                  borderRadius: '12px',
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

          <div style={{ fontSize: '13px', color: '#d4d4d8', marginBottom: '10px', lineHeight: '1.5' }}>
            <strong>{t.hypothesisLabel}:</strong> {selectedLab.description[lang]}
          </div>

          <div style={{ fontSize: '13px', color: selectedLab.status === 'winner' ? '#86efac' : '#fca5a5', lineHeight: '1.5' }}>
            <strong>{t.keyFindingLabel}:</strong> {selectedLab.keyFinding[lang]}
          </div>
        </div>

        {/* List of Labs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {LABS_DATA.map((lab) => {
            const isSelected = lab.id === selectedLab.id
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
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isSelected ? '#3b82f6' : '#27272a'}`,
                  color: '#f4f4f5',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.1s ease',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400 }}>
                  {lab.title[lang]}
                </span>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '6px',
                  backgroundColor: badge.bg,
                  color: badge.color,
                  fontSize: '10px',
                  fontWeight: 700,
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
