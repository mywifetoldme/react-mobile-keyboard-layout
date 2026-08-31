import { useState, useRef } from 'react'
import {
  SubpageLayout,
  FloatingInput,
} from 'react-mobile-keyboard-layout'
import { translations, type Language } from '../i18n'

export const ComparatorView = ({ lang }: { lang: Language }) => {
  const t = translations[lang]
  const [mode, setMode] = useState<'zeroShift' | 'standard'>('zeroShift')
  const [inputVal, setInputVal] = useState('')
  const bodyRef = useRef<HTMLDivElement | null>(null)

  const isZeroShift = mode === 'zeroShift'

  return (
    <SubpageLayout
      bodyRef={bodyRef}
      title="Before / After"
      footer={
        isZeroShift ? (
          <FloatingInput
            value={inputVal}
            onChange={setInputVal}
            onSubmit={() => setInputVal('')}
            placeholder="Zero-Shift floating input..."
          />
        ) : (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            backgroundColor: '#18181b',
            borderTop: '1px solid #3f3f46',
            display: 'flex',
            gap: '8px',
          }}>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Standard fixed input (breaks on Safari)..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '20px',
                border: '1px solid #52525b',
                backgroundColor: '#27272a',
                color: '#f4f4f5',
                outline: 'none',
              }}
            />
          </div>
        )
      }
    >
      <div style={{ padding: '16px' }}>
        {/* Toggle Switch */}
        <div style={{
          display: 'flex',
          backgroundColor: '#27272a',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '20px',
        }}>
          <button
            type="button"
            onClick={() => setMode('zeroShift')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isZeroShift ? '#3b82f6' : 'transparent',
              color: isZeroShift ? '#ffffff' : '#a1a1aa',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Zero-Shift Engine
          </button>
          <button
            type="button"
            onClick={() => setMode('standard')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: !isZeroShift ? '#ef4444' : 'transparent',
              color: !isZeroShift ? '#ffffff' : '#a1a1aa',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Standard Safari
          </button>
        </div>

        {/* Info Card */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: isZeroShift ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isZeroShift ? '#3b82f6' : '#ef4444'}`,
          marginBottom: '24px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: isZeroShift ? '#60a5fa' : '#f87171' }}>
            {isZeroShift ? t.compZeroShiftTitle : t.compStandardTitle}
          </h3>
          <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#d4d4d8' }}>
            {isZeroShift ? t.compZeroShiftDesc : t.compStandardDesc}
          </p>
        </div>

        {/* Feed Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid #27272a',
                fontSize: '13px',
                color: '#e4e4e7',
              }}
            >
              Item #{i + 1} — Tap the input below and notice {isZeroShift ? 'zero reading line displacement' : 'the screen jitter and 34px gap'}.
            </div>
          ))}
        </div>
      </div>
    </SubpageLayout>
  )
}
