import { useState, useRef, type TouchEvent } from 'react'
import { Navigation, TAB_KEYS, type TabKey } from './components/Navigation'
import { PlaygroundView } from './views/PlaygroundView'
import { LabsView } from './views/LabsView'
import { DocsView } from './views/DocsView'
import type { Language } from './i18n'
import 'react-mobile-keyboard-layout/dist/index.css'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('playground')
  const [lang, setLang] = useState<Language>('en')

  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ko' : 'en'))
  }

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY

    // Detect horizontal swipe (horizontal distance > 60px and more horizontal than vertical)
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      const currentIndex = TAB_KEYS.indexOf(activeTab)
      if (diffX > 0 && currentIndex < TAB_KEYS.length - 1) {
        // Swipe Left -> Next Tab
        setActiveTab(TAB_KEYS[currentIndex + 1])
      } else if (diffX < 0 && currentIndex > 0) {
        // Swipe Right -> Prev Tab
        setActiveTab(TAB_KEYS[currentIndex - 1])
      }
    }
    touchStartXRef.current = null
    touchStartYRef.current = null
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
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {activeTab === 'playground' && <PlaygroundView lang={lang} header={navHeader} />}
      {activeTab === 'labs' && <LabsView lang={lang} header={navHeader} />}
      {activeTab === 'docs' && <DocsView lang={lang} header={navHeader} />}
    </div>
  )
}
