import { useState, useEffect, type ReactNode } from 'react'
import { SubpageLayout } from 'react-mobile-keyboard-layout'
import { LABS_DATA, type LabInfo } from '../data/labsData'
import { translations, type Language } from '../i18n'
import { LabSandbox } from '../components/LabSandbox'

interface LabsViewProps {
  lang: Language
  header?: ReactNode
}

export const LabsView = ({ lang, header }: LabsViewProps) => {
  const t = translations[lang]
  const [activeLab, setActiveLab] = useState<LabInfo | null>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('exp=')) {
      const expId = window.location.hash.split('exp=')[1]?.split('&')[0]
      return LABS_DATA.find((l) => l.id === expId) ?? null
    }
    return null
  })

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.includes('exp=')) {
        const expId = window.location.hash.split('exp=')[1]?.split('&')[0]
        const found = LABS_DATA.find((l) => l.id === expId)
        if (found) setActiveLab(found)
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

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

  // If a lab is opened, render its dedicated physics sandbox full-screen
  if (activeLab) {
    return (
      <LabSandbox
        lab={activeLab}
        lang={lang}
        onClose={() => {
          setActiveLab(null)
          if (typeof window !== 'undefined') {
            window.location.hash = '#labs'
          }
        }}
      />
    )
  }

  return (
    <SubpageLayout header={header} title={t.labsArchiveTitle}>
      <div style={{ padding: '16px 16px 36px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          gap: '10px',
        }}>
          <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5', margin: 0 }}>
            {t.labsArchiveSubtitle}
          </p>
          <a
            href={lang === 'ko' ? '/labs.ko.html' : '/labs.html'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#272730',
              border: '1px solid #3f3f4e',
              color: '#60a5fa',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            📄 {lang === 'ko' ? '전체 문서 보기' : 'View Full Docs'}
          </a>
        </div>

        {/* Labs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {LABS_DATA.map((lab) => {
            const badge = getStatusBadge(lab.status)
            const isWinner = lab.status === 'winner'

            return (
              <div
                key={lab.id}
                onClick={() => setActiveLab(lab)}
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
                  {lab.hypothesis[lang]}
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
