import { useState } from 'react'
import { Navigation, type TabKey } from './components/Navigation'
import { PlaygroundView } from './views/PlaygroundView'
import { ComparatorView } from './views/ComparatorView'
import { LabsView } from './views/LabsView'
import { DocsView } from './views/DocsView'
import type { Language } from './i18n'
import 'react-mobile-keyboard-layout/dist/index.css'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('playground')
  const [lang, setLang] = useState<Language>('en')

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ko' : 'en'))
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lang={lang}
        onToggleLang={toggleLang}
      />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'playground' && <PlaygroundView lang={lang} />}
        {activeTab === 'comparator' && <ComparatorView lang={lang} />}
        {activeTab === 'labs' && <LabsView lang={lang} />}
        {activeTab === 'docs' && <DocsView lang={lang} />}
      </div>
    </div>
  )
}
