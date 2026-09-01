import { translations, type Language } from '../i18n'

export type TabKey = 'playground' | 'comparator' | 'labs' | 'docs'

export const TAB_KEYS: TabKey[] = ['playground', 'comparator', 'labs', 'docs']

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
    { key: 'comparator', label: t.tabComparator },
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
        paddingLeft: '8px',
        paddingRight: '8px',
        gap: '6px',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
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
                padding: '6px 2px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#3b82f6' : 'transparent',
                color: isActive ? '#ffffff' : '#a1a1aa',
                fontSize: '11px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
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
          padding: '5px 8px',
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
