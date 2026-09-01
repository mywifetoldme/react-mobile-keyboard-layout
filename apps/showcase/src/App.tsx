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

  const navHeader = (
    <Navigation
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      lang={lang}
      onToggleLang={toggleLang}
    />
  )

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {activeTab === 'playground' && <PlaygroundView lang={lang} header={navHeader} />}
      {activeTab === 'comparator' && <ComparatorView lang={lang} header={navHeader} />}
      {activeTab === 'labs' && <LabsView lang={lang} header={navHeader} />}
      {activeTab === 'docs' && <DocsView lang={lang} header={navHeader} />}
    </div>
  )
}
