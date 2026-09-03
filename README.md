# react-mobile-keyboard-layout

[![npm version](https://img.shields.io/npm/v/react-mobile-keyboard-layout.svg?color=blue)](https://www.npmjs.com/package/react-mobile-keyboard-layout)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success.svg)](#)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Cloudflare_Pages-F38020.svg?logo=cloudflare)](https://react-mobile-keyboard-layout.pages.dev/)

> **Zero-shift header, 0.0px scroll anchoring, and seamless floating input for mobile web and iOS Safari.**
>
> 📱 **Live Interactive Demo**: [https://react-mobile-keyboard-layout.pages.dev/](https://react-mobile-keyboard-layout.pages.dev/)
>
> ⚠️ **Important**: This library is specifically engineered to eliminate software keyboard layout shift on touch devices (**iOS Safari**, Android Chrome, Mobile PWA). Open on a real phone or touch device emulator to see the layout engine in action.

<p align="center">
  <a href="https://react-mobile-keyboard-layout.pages.dev/">
    <img src="./docs/assets/demo-qr.png" alt="Scan QR Code to open Mobile Demo" width="140" height="140" />
  </a>
  <br />
  <sub>📱 Scan with iPhone / Android Camera to Open Live Demo</sub>
</p>

[English] | [한국어](./README.ko.md)

---

## ⚡ The Problem with Mobile Web Keyboards

On mobile browsers—especially **iOS Safari / WebKit**—virtual software keyboards trigger well-known layout issues:
1. **Header Shift & Drift**: When the viewport shrinks, fixed headers re-render and jitter or scroll off-screen.
2. **Reading Line Jumps**: Tapping an input can trigger a sudden scroll jump that displaces the content you were reading.
3. **The 34px Ghost Gap**: Fixed bottom input bars often leave an empty gap above the home indicator bar.
4. **Picker Invalidation**: Heavy programmatic scroll locking can cause native date/time pickers (`<input type="date">`, `<select>`) to dismiss immediately upon opening.

`react-mobile-keyboard-layout` addresses these layout challenges using standard W3C APIs (`visualViewport`, `ResizeObserver`, `preventScroll`) with **zero external dependencies**.

---

## 🎯 Architecture & Approach

- **0.0px Coordinate Preservation Formula**:
  $$\Delta H = H_{\text{closed}} - H_{\text{current}}$$
  $$S_{\text{new}} = S_0 + \Delta H$$
  As the container contracts, adding $\Delta H$ to `scrollTop` maintains your reading position with minimal visual shift.
- **Physically Isolated Static Header**:
  The header sits outside the resizing body container, preventing layout reflow jitter when the keyboard opens and closes.
- **120Hz rAF Continuous Window Top-Lock**:
  Clamps `window.scrollY = 0` during the 350ms keyboard animation to reduce background rubberbanding.
- **3-State Focus Handover State Machine**:
  Smoothly transfers focus between inline form inputs and the bottom floating bar (`none` | `floating` | `body`).
- **Native Picker Passthrough**:
  Differentiates virtual keyboard text inputs from native modal sheets (`<input type="date">`, `<input type="time">`, `<select>`), allowing system pickers to open naturally.

---

## 📦 Installation

```bash
npm install react-mobile-keyboard-layout
# or
pnpm add react-mobile-keyboard-layout
# or
yarn add react-mobile-keyboard-layout
```

---

## 🚀 Quick Start

```tsx
import { useRef, useState } from 'react'
import {
  SubpageLayout,
  FloatingInput,
  useMobileKeyboard,
} from 'react-mobile-keyboard-layout'
import 'react-mobile-keyboard-layout/dist/index.css'

export default function ChatScreen() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<string[]>([])
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const engine = useMobileKeyboard({ bodyRef })

  const handleSend = () => {
    if (!text.trim()) return
    setMessages((prev) => [...prev, text.trim()])
    setText('')
    
    requestAnimationFrame(() => {
      engine.scrollToBottom('smooth')
    })
  }

  return (
    <SubpageLayout
      bodyRef={bodyRef}
      keyboardEngine={engine}
      title="Conversation"
      footer={
        <FloatingInput
          value={text}
          onChange={setText}
          onSubmit={handleSend}
          placeholder="Write a message..."
          onFocus={engine.handleFloatingFocus}
          onBlur={engine.handleFloatingBlur}
          isSuppressed={engine.isFloatingSuppressed}
        />
      }
    >
      <div style={{ padding: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} className="message-bubble">
            {msg}
          </div>
        ))}
      </div>
    </SubpageLayout>
  )
}
```

---

## 🎨 CSS Variables & Theming

```css
:root {
  --rmkl-bg: #ffffff;
  --rmkl-text: #18181b;
  --rmkl-border: #e4e4e7;
  --rmkl-header-height: 56px;
  --rmkl-header-bg: rgba(255, 255, 255, 0.85);
  --rmkl-header-border: #e4e4e7;
  --rmkl-input-bg: #f4f4f5;
  --rmkl-input-text: #18181b;
  --rmkl-input-border: #e4e4e7;
  --rmkl-primary: #2563eb;
  --rmkl-primary-text: #ffffff;
}
```

---

## 📱 Tested Environments & Limitations

- **Verified On**: Physical devices running iOS 26 and iOS 27 beta (Mobile Safari, PWA Standalone Mode, Chrome iOS), Android Chrome, and Desktop Chrome/Safari.
- **Known Considerations**:
  - Focus and viewport behavior can vary with third-party virtual keyboards (e.g. custom IME extensions) and iPad multi-window split views.
  - Feedback and issues from different device/OS combinations are warmly appreciated.

---

## 📄 License

MIT © [Clubsandwich](https://github.com/mywifetoldme)
