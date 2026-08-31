import { useState } from 'react'
import { SubpageLayout } from 'react-mobile-keyboard-layout'
import { translations, type Language } from '../i18n'

export const DocsView = ({ lang }: { lang: Language }) => {
  const t = translations[lang]
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install react-mobile-keyboard-layout')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <SubpageLayout title={t.docsTitle}>
      <div style={{ padding: '16px 16px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Installation */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#f4f4f5' }}>
            {t.quickstartTitle}
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#60a5fa',
          }}>
            <span>npm install react-mobile-keyboard-layout</span>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: copied ? '#22c55e' : '#27272a',
                color: copied ? '#052e16' : '#d4d4d8',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </div>

        {/* Basic Usage Snippet */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#f4f4f5' }}>
            {t.basicUsageTitle}
          </h3>
          <pre style={{
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            fontSize: '12px',
            lineHeight: '1.5',
            color: '#d4d4d8',
            overflowX: 'auto',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}>
{`import { useRef, useState } from 'react'
import {
  SubpageLayout,
  FloatingInput,
  useMobileKeyboard
} from 'react-mobile-keyboard-layout'
import 'react-mobile-keyboard-layout/dist/index.css'

export default function ChatPage() {
  const [draft, setDraft] = useState('')
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const engine = useMobileKeyboard({ bodyRef })

  const handleSend = () => {
    // 1. send message logic...
    setDraft('')
    // 2. smooth scroll to bottom
    engine.scrollToBottom('smooth')
  }

  return (
    <SubpageLayout
      bodyRef={bodyRef}
      keyboardEngine={engine}
      title="Chat"
      footer={
        <FloatingInput
          value={draft}
          onChange={setDraft}
          onSubmit={handleSend}
          placeholder="Write a message..."
          onFocus={engine.handleFloatingFocus}
          onBlur={engine.handleFloatingBlur}
          isSuppressed={engine.isFloatingSuppressed}
        />
      }
    >
      <div className="chat-feed">
        {/* Your scrollable content */}
      </div>
    </SubpageLayout>
  )
}`}
          </pre>
        </div>

        {/* CSS Variables */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#f4f4f5' }}>
            {t.themeCustomizationTitle}
          </h3>
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#a1a1aa',
            fontFamily: 'monospace',
          }}>
            <div>--rmkl-bg: #ffffff;</div>
            <div>--rmkl-text: #18181b;</div>
            <div>--rmkl-border: #e4e4e7;</div>
            <div>--rmkl-header-height: 56px;</div>
            <div>--rmkl-input-bg: #f4f4f5;</div>
            <div>--rmkl-primary: #2563eb;</div>
          </div>
        </div>

        {/* First-Principles Mathematical Model */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#f4f4f5' }}>
            {t.mathModelTitle}
          </h3>
          <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#d4d4d8' }}>
            {t.mathModelDesc}
          </p>
        </div>
      </div>
    </SubpageLayout>
  )
}
