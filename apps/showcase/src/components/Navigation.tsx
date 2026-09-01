import { translations, type Language } from '../i18n'

export type TabKey = 'playground' | 'labs' | 'docs'

export const TAB_KEYS: TabKey[] = ['playground', 'labs', 'docs']

interface NavigationProps {
  activeTab: TabKey
  onSelectTab: (tab: TabKey) => void
  lang: Language
  onToggleLang: () => void
}

export const Navigation = ({
  activeTab,
  onSelectTab,
  lang,
  onToggleLang,
}: NavigationProps) => {
  const t = translations[lang]

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'playground', label: t.tabPlayground },
    { key: 'labs', label: t.tabLabs },
    { key: 'docs', label: t.tabDocs },
  ]

  return (
    <header
      role="banner"
      className="rmkl-subpage-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '12px',
        paddingRight: '12px',
        gap: '8px',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        flex: 1,
        minWidth: 0,
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              style={{
                padding: '7px 0',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#3b82f6' : 'transparent',
                color: isActive ? '#ffffff' : '#a1a1aa',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.2px',
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                transition: 'all 0.1s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onToggleLang}
        style={{
          padding: '6px 10px',
          borderRadius: '8px',
          border: '1px solid #3f3f46',
          backgroundColor: '#27272a',
          color: '#f4f4f5',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        🌐 {t.toggleLang}
      </button>
    </header>
  )
}
