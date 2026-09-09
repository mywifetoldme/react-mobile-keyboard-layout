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

`react-mobile-keyboard-layout` addresses these layout challenges with CSS (`:has()`, `:focus-within`) plus two standard APIs (`visualViewport`, `preventScroll`), with **zero external dependencies**.

---

## 🎯 Architecture & Approach

- **CSS decides the keyboard state**:
  Whether the keyboard is open, whether the focused input sits in the body or in the floating bar, and whether a native picker is open are all read from selectors (`:focus-within`, `:has()`) in the stylesheet. There is no JavaScript state machine that can drift out of sync.
- **Physically Isolated Static Header**:
  The header sits outside the resizing body container, preventing layout reflow jitter when the keyboard opens and closes.
- **Tap interception instead of scroll correction**:
  Text inputs are focused with `preventScroll: true` on `pointerdown`, before iOS pans the window to reveal them. A short rAF top-lock (350ms) only remains as a fallback: frame-by-frame video measurement on iOS 26 showed that undoing the pan afterwards always leaves a ~240ms header jump.
- **Keyboard height as CSS variables**:
  The one value CSS cannot read, the keyboard height, is published as `--rmkl-kb` (browsers report the keyboard in one of two ways: some shrink only the visual viewport, so the height is `innerHeight - visualViewport.height`; others shrink the layout viewport itself, so it is the drop in `innerHeight`. Both are read, and which one a given browser and version uses has to be measured rather than assumed — iOS Safari, Android Chrome 133 and WKWebView all took the visual-viewport path when measured). The part of the layout viewport the keyboard covers is published as `--rmkl-kb-inset` and reserved as bottom padding. On blur the layout snaps back synchronously through `:not(:focus-within)`, without waiting for the delayed `visualViewport` resize event.
- **Reading position kept**:
  The body scrolls from the bottom (`flex-direction: column-reverse`, children stay in DOM order). At the end of the feed the browser keeps the newest message in place by itself; scrolled up, WebKit keeps the top-based offset instead, so the hook puts the bottom edge back when the box changes while the floating bar has the focus.
- **A focused body input stays put**:
  A bottom-anchored body would push a focused form field up when the keyboard takes space. The hook watches the body with a `ResizeObserver`, shifts the scroll offset so the field keeps its screen position (or reveals it when the keyboard would hide it), and puts it back where it was when the keyboard leaves.
- **Native Picker Passthrough**:
  Differentiates virtual keyboard text inputs from native modal sheets (`<input type="date">`, `<input type="time">`, `<select>`), allowing system pickers to open naturally.

---

## 🧭 Two Layouts

- **`SubpageLayout` (★ Official Winner / Recommended Default)** — The page is the shell; document scroll is permanently locked to `0`. It establishes an absolute peace treaty with the browser, powered by 100% declarative CSS flexbox (`column-reverse`) and `--rmkl-kb-inset`. Because document scroll never moves, Safari's window pan, caret reveal jump, and delayed click collisions never occur. Zero drift, zero flicker, and zero maintenance overhead across iOS releases. Ideal for chat rooms, messenger apps, dashboards, and interactive forms.
- **`PageLayout` (Advanced Hybrid Layout)** — For content-first pages (e.g., articles with comments) where native document scrolling to collapse Safari's URL bar (`100lvh`) is strictly required. The document scrolls freely while reading. Upon tapping an input, the layout dynamically freezes the document at `calc(offset + 100lvh)` and hands off control to an App Shell scroller without jumping. Features deep WebKit event interception (pointerup tap locking, synthetic click suppression, and viewport sync deadzones).

Both layouts decide their state in CSS (`:has()` and `:focus-within`) and share `useMobileKeyboard`.

```tsx
// 1. Primary Recommendation: SubpageLayout (Chat / App Shell)
import { SubpageLayout, FloatingInput } from 'react-mobile-keyboard-layout'
import 'react-mobile-keyboard-layout/dist/index.css'

export function ChatPage() {
  const [text, setText] = useState('')
  return (
    <SubpageLayout title="Chat" footer={<FloatingInput value={text} onChange={setText} onSubmit={send} />}>
      <MessageList />
    </SubpageLayout>
  )
}

// 2. Advanced Hybrid: PageLayout (Collapsible URL Bar)
import { PageLayout, FloatingInput } from 'react-mobile-keyboard-layout'
import 'react-mobile-keyboard-layout/dist/index.css'

export function ArticlePage() {
  const [text, setText] = useState('')
  return (
    <PageLayout title="Article" footer={<FloatingInput value={text} onChange={setText} onSubmit={post} />}>
      <ArticleBody />
      <Comments />
    </PageLayout>
  )
}
```

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
          {...engine.floatingProps}
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

- **Verified On**: the CSS-first layout was measured frame by frame on an iOS 26 Simulator (Mobile Safari), and again on an Android 16 emulator running Android Chrome 133 with the soft keyboard (Gboard) — the AVD has to be cold-booted with `hw.keyboard=no`, otherwise no IME insets are produced at all. Chrome for iOS cannot be installed on a simulator, so it was measured by proxy through a minimal WKWebView app (the engine Chrome for iOS has to use); Chrome's own toolbar and gestures are not covered by that proxy, and the physical Chrome for iOS app is still unverified. In all three, the bottom input bar and a body input at the very bottom opened and closed correctly and returned to their pre-focus position. Earlier, engine-based versions were verified on physical devices running iOS 26 / iOS 27 beta (Mobile Safari, PWA Standalone Mode, Chrome iOS), Android Chrome, and Desktop Chrome/Safari; re-verification reports are welcome.
- **Browser support**: relies on CSS `:has()` (Safari 15.4+, Chrome 105+, Firefox 121+).
- **Known Considerations**:
  - Focus and viewport behavior can vary with third-party virtual keyboards (e.g. custom IME extensions) and iPad multi-window split views.
  - Feedback and issues from different device/OS combinations are warmly appreciated.

---

## 📄 License

MIT © [Clubsandwich](https://github.com/mywifetoldme)
