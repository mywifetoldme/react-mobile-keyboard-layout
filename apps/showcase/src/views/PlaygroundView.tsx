import { useState, useRef } from 'react'
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

export const PlaygroundView = ({ lang }: { lang: Language }) => {
  const t = translations[lang]
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const engine = useMobileKeyboard({ bodyRef })

  const [inputVal, setInputVal] = useState('')
  const [titleVal, setTitleVal] = useState('')
  const [dateVal, setDateVal] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t.sampleMessage1,
      sender: 'bot',
      time: '10:00 AM',
    },
    {
      id: '2',
      text: t.sampleMessage2,
      sender: 'bot',
      time: '10:01 AM',
    },
    {
      id: '3',
      text: t.sampleMessage3,
      sender: 'bot',
      time: '10:02 AM',
    },
  ])

  const handleSend = () => {
    if (!inputVal.trim()) return
    const newMsg: Message = {
      id: String(Date.now()),
      text: inputVal.trim(),
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, newMsg])
    setInputVal('')

    requestAnimationFrame(() => {
      engine.scrollToBottom('smooth')
    })
  }

  return (
    <SubpageLayout
      bodyRef={bodyRef}
      keyboardEngine={engine}
      title="Playground"
      footer={
        <FloatingInput
          value={inputVal}
          onChange={setInputVal}
          onSubmit={handleSend}
          placeholder={t.demoInputPlaceholder}
          {...engine.floatingProps}
          isSuppressed={engine.isFloatingSuppressed}
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
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #3f3f46',
                backgroundColor: '#18181b',
                color: '#f4f4f5',
                fontSize: '14px',
                outline: 'none',
              }}
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
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #3f3f46',
                backgroundColor: '#18181b',
                color: '#f4f4f5',
                fontSize: '14px',
                outline: 'none',
              }}
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
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isUser ? '#2563eb' : '#27272a',
                    color: '#ffffff',
                    fontSize: '14px',
                    lineHeight: '1.45',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
                <span style={{ fontSize: '10px', color: '#71717a', marginTop: '3px' }}>
                  {msg.time}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </SubpageLayout>
  )
}
