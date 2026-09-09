import { useState, type ReactNode } from 'react'
import { SubpageLayout } from 'react-mobile-keyboard-layout'
import { translations, type Language } from '../i18n'

const card = {
  padding: '14px',
  borderRadius: '10px',
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  fontSize: '13px',
  lineHeight: '1.55',
  color: '#d4d4d8',
} as const

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#f4f4f5' }}>{title}</h3>
    {children}
  </section>
)

const Steps = ({ items, tint }: { items: string[]; tint: string }) => (
  <ol style={{ ...card, margin: 0, paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {items.map((item) => (
      <li key={item} style={{ color: '#d4d4d8' }}>
        <span style={{ color: tint }}>{item.split(' — ')[0]}</span>
        {item.includes(' — ') ? ` — ${item.split(' — ').slice(1).join(' — ')}` : ''}
      </li>
    ))}
  </ol>
)

const Bullets = ({ items }: { items: string[] }) => (
  <ul style={{ ...card, margin: 0, paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
)

const Code = ({ children, color = '#e4e4e7' }: { children: string; color?: string }) => (
  <pre style={{ ...card, padding: '14px', fontSize: '12px', lineHeight: '1.5', overflowX: 'auto', color, margin: 0 }}>{children}</pre>
)

/**
 * The Docs tab reads as the story the labs tell — why, what was learned, what shape that left
 * the package in, and how it was verified — with the install snippet at the end.
 */
export const DocsView = ({ lang, header }: { lang: Language; header?: ReactNode }) => {
  const t = translations[lang]
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(t.installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <SubpageLayout header={header} title={t.docsTitle}>
      <div style={{ padding: '16px 16px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Section title={t.docsWhyTitle}>
          <div style={{ ...card, backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{t.docsWhyBody}</div>
        </Section>

        <Section title={t.docsJourneyTitle}>
          <Steps items={[t.docsJourney1, t.docsJourney2, t.docsJourney3, t.docsJourney4]} tint="#60a5fa" />
        </Section>

        <Section title={t.docsShapeTitle}>
          <Bullets items={[t.docsShape1, t.docsShape2, t.docsShape3]} />
        </Section>

        <Section title={t.docsLayoutsTitle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ ...card, border: '1px solid rgba(34, 197, 94, 0.35)', backgroundColor: 'rgba(34, 197, 94, 0.06)' }}>{t.docsLayoutShell}</div>
            <div style={{ ...card, border: '1px solid rgba(59, 130, 246, 0.35)', backgroundColor: 'rgba(59, 130, 246, 0.06)' }}>{t.docsLayoutUnlocked}</div>
          </div>
        </Section>

        <Section title={t.docsVerifyTitle}>
          <div style={card}>{t.docsVerifyBody}</div>
        </Section>

        <Section title={t.docsUseTitle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                gap: '8px',
              }}
            >
              <code style={{ fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa', whiteSpace: 'nowrap', overflowX: 'auto', flex: 1 }}>
                {t.installCmd}
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
            <Code>{`import { SubpageLayout, FloatingInput } from 'react-mobile-keyboard-layout'
import 'react-mobile-keyboard-layout/dist/index.css'

export function ChatPage() {
  const [text, setText] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  return (
    <SubpageLayout
      bodyRef={bodyRef}
      title="Chat"
      footer={<FloatingInput value={text} onChange={setText} onSubmit={handleSend} />}
    >
      <MessageList />
    </SubpageLayout>
  )
}`}</Code>
            <Code color="#a1a1aa">{`/* ${t.themeCustomizationTitle} */
:root {
  --rmkl-bg: #09090b;
  --rmkl-text: #f4f4f5;
  --rmkl-border: #27272a;
  --rmkl-header-height: 56px;
  --rmkl-header-bg: rgba(9, 9, 11, 0.85);
  --rmkl-primary: #3b82f6;
  --rmkl-primary-text: #ffffff;
}`}</Code>
          </div>
        </Section>
      </div>
    </SubpageLayout>
  )
}
