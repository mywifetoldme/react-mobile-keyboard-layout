import { useState, useRef, type CSSProperties, type ReactNode } from 'react'
import {
  SubpageLayout,
  FloatingInput,
  useMobileKeyboard,
} from 'react-mobile-keyboard-layout'
import { HudOverlay } from '../components/HudOverlay'
import { translations, type Language } from '../i18n'

interface Message {
  id: string
  text: string
  sender: 'bot' | 'user'
  time: string
}

interface PlaygroundViewProps {
  lang: Language
  header?: ReactNode
}

const inputStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  minHeight: '44px',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #3f3f46',
  backgroundColor: '#18181b',
  color: '#f4f4f5',
  fontSize: '15px',
  outline: 'none',
  WebkitAppearance: 'none',
  fontFamily: 'inherit',
}

export const PlaygroundView = ({ lang, header }: PlaygroundViewProps) => {
  const t = translations[lang]
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const engine = useMobileKeyboard({ bodyRef })

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t.sampleMessage1,
      sender: 'bot',
      time: '12:00',
    },
    {
      id: '2',
      text: t.sampleMessage2,
      sender: 'bot',
      time: '12:01',
    },
    {
      id: '3',
      text: t.sampleMessage3,
      sender: 'bot',
      time: '12:02',
    },
  ])

  const [inputVal, setInputVal] = useState('')
  const [titleVal, setTitleVal] = useState('')
  const [dateVal, setDateVal] = useState('2026-09-01')
  const [bottomTitleVal, setBottomTitleVal] = useState('')
  const [bottomDateVal, setBottomDateVal] = useState('2026-09-02')

  const handleSend = () => {
    if (!inputVal.trim()) return
    const newMsg: Message = {
      id: Date.now().toString(),
      text: inputVal,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, newMsg])
    setInputVal('')
    setTimeout(() => {
      engine.scrollToBottom('smooth')
    }, 50)
  }

  return (
    <SubpageLayout
      bodyRef={bodyRef}
      keyboardEngine={engine}
      header={header}
      title="Playground"
      footer={
        <FloatingInput
          value={inputVal}
          onChange={setInputVal}
          onSubmit={handleSend}
          placeholder={t.demoInputPlaceholder}
          {...engine.floatingProps}
          isSuppressed={engine.isFloatingSuppressed}
          isKeyboardOpen={engine.isKeyboardOpen}
        />
      }
    >
      <HudOverlay engine={engine} lang={lang} />

      <div style={{ padding: '0 16px 24px' }}>
        {/* Test Inline Body Inputs */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa' }}>
            Form Inputs & Picker Test
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#71717a', display: 'block', marginBottom: '4px' }}>
              {t.testBodyInput} (triggers focus handover FSM)
            </label>
            <input
              type="text"
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              placeholder="Tap here (floating bar will suppress)..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#71717a', display: 'block', marginBottom: '4px' }}>
              {t.testDatePicker} (native sheet passthrough)
            </label>
            <input
              type="date"
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Chat Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user'
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  backgroundColor: isUser ? '#3b82f6' : '#27272a',
                  color: isUser ? '#ffffff' : '#f4f4f5',
                  padding: '10px 14px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  wordBreak: 'break-word',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div>{msg.text}</div>
                <div
                  style={{
                    fontSize: '10px',
                    opacity: 0.6,
                    marginTop: '4px',
                    textAlign: 'right',
                  }}
                >
                  {msg.time}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Test Inline Body Inputs */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '16px',
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa' }}>
            Form Inputs & Picker Test (Bottom of Body)
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#71717a', display: 'block', marginBottom: '4px' }}>
              {t.testBodyInput} (Bottom input)
            </label>
            <input
              type="text"
              value={bottomTitleVal}
              onChange={(e) => setBottomTitleVal(e.target.value)}
              placeholder="Bottom input tap test..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#71717a', display: 'block', marginBottom: '4px' }}>
              {t.testDatePicker} (Bottom picker)
            </label>
            <input
              type="date"
              value={bottomDateVal}
              onChange={(e) => setBottomDateVal(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    </SubpageLayout>
  )
}
