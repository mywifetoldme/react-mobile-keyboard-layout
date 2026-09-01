import { useState, type ReactNode } from 'react'
import { SubpageLayout } from 'react-mobile-keyboard-layout'
import { translations, type Language } from '../i18n'

export const DocsView = ({ lang, header }: { lang: Language; header?: ReactNode }) => {
  const t = translations[lang]
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText('npm i react-mobile-keyboard-layout')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <SubpageLayout header={header} title={t.docsTitle}>
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
            padding: '10px 12px',
            borderRadius: '10px',
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            gap: '8px',
          }}>
            <code style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#60a5fa',
              whiteSpace: 'nowrap',
              overflowX: 'auto',
              flex: 1,
            }}>
              npm i react-mobile-keyboard-layout
            </code>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: copied ? '#22c55e' : '#27272a',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'background-color 0.15s ease',
              }}
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </div>

        {/* Basic Usage Code Block */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#f4f4f5' }}>
            {t.basicUsageTitle}
          </h3>
          <pre style={{
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '12px',
            lineHeight: '1.5',
            overflowX: 'auto',
            color: '#e4e4e7',
          }}>
            {`import { SubpageLayout, FloatingInput } from 'react-mobile-keyboard-layout'
import 'react-mobile-keyboard-layout/dist/index.css'

export function ChatPage() {
  const [text, setText] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  return (
    <SubpageLayout
      bodyRef={bodyRef}
      title="Chat"
      footer={
        <FloatingInput
          value={text}
          onChange={setText}
          onSubmit={handleSend}
        />
      }
    >
      <MessageList />
    </SubpageLayout>
  )
}`}
          </pre>
        </div>

        {/* Mathematical Model */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#f4f4f5' }}>
            {t.mathModelTitle}
          </h3>
          <div style={{
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#d4d4d8',
          }}>
            {t.mathModelDesc}
          </div>
        </div>

        {/* CSS Variables */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#f4f4f5' }}>
            {t.themeCustomizationTitle}
          </h3>
          <pre style={{
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '12px',
            lineHeight: '1.5',
            overflowX: 'auto',
            color: '#a1a1aa',
          }}>
            {`:root {
  --rmkl-bg: #09090b;
  --rmkl-text: #f4f4f5;
  --rmkl-border: #27272a;
  --rmkl-header-height: 56px;
  --rmkl-header-bg: rgba(9, 9, 11, 0.85);
  --rmkl-primary: #3b82f6;
  --rmkl-primary-text: #ffffff;
}`}
          </pre>
        </div>
      </div>
    </SubpageLayout>
  )
}
