import { useState, useEffect } from 'react'
import { Navigation, type TabKey } from './components/Navigation'
import { PlaygroundView } from './views/PlaygroundView'
import { LabsView } from './views/LabsView'
import { DocsView } from './views/DocsView'
import type { Language } from './i18n'
import 'react-mobile-keyboard-layout/dist/index.css'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      if (window.location.hash.startsWith('#labs')) return 'labs'
      if (window.location.hash.startsWith('#docs')) return 'docs'
    }
    return 'playground'
  })
  const [lang, setLang] = useState<Language>('en')

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith('#labs')) setActiveTab('labs')
      else if (window.location.hash.startsWith('#docs')) setActiveTab('docs')
      else if (window.location.hash.startsWith('#playground')) setActiveTab('playground')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleSelectTab = (tab: TabKey) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      window.location.hash = `#${tab}`
    }
  }

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ko' : 'en'))
  }

  const navHeader = (
    <Navigation
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      lang={lang}
      onToggleLang={toggleLang}
    />
  )

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {activeTab === 'playground' && <PlaygroundView lang={lang} header={navHeader} />}
      {activeTab === 'labs' && <LabsView lang={lang} header={navHeader} />}
      {activeTab === 'docs' && <DocsView lang={lang} header={navHeader} />}
    </div>
  )
}

