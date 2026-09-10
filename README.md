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

`react-mobile-keyboard-layout` addresses these with one layout: a page that scrolls like any web page until an input is tapped, and is an app shell while the keyboard is up. CSS plus two standard APIs (`visualViewport`, `preventScroll`), **zero external dependencies**, and exactly one number that no specification gives.

---

## 🎯 Architecture & Approach

- **Two states, one attribute**:
  Idle, the document scrolls and Safari collapses its URL bar; header and composer are `position: sticky`, in flow. The shell is keyed to one attribute on the root, `data-rmkl-shell`, and PageLayout.css does the rest: `position: fixed` shell, header pinned, a `column-reverse` body scroller at the same reading position, the composer on the keyboard inset. There is no state machine.
- **The tap builds the shell, then focuses**:
  Safari decides where to reveal a caret at the moment the input is focused. So on `pointerup` the layout publishes the document offset, sets the attribute, lays the shell out, hands the offset to the body scroller — and only then focuses. Safari finds the input inside the shell's own scroller and has nothing to pan (device: 9 of 48 opens panned with the shell keyed to `:focus`, 0 of 47 keyed to the attribute).
- **The document is capped, never `position: fixed`**:
  While the shell is up the document is `calc(offset + 100lvh)` tall with `overflow: hidden`: it keeps its offset, Safari's URL bar stays as it was, and on blur the document is exactly where the reader left it. Fixing the body resets the offset and makes Safari re-expand its URL bar under the finger. A guard with no number in it puts the window back should Safari still move it.
- **Keyboard height as CSS variables**:
  The one value CSS cannot read is published as `--rmkl-kb` and, as the part of the layout viewport the keyboard covers, `--rmkl-kb-inset` (`innerHeight − visualViewport.height × scale`; browsers that shrink the layout viewport instead report the drop in `innerHeight`). Measured on `resize` and on `scroll` — iOS restores `innerHeight` after its own pan without a resize event.
- **Reading position kept**:
  The body scrolls from the bottom (`flex-direction: column-reverse`, children in DOM order). A focused body input keeps its screen position while the keyboard takes space, and is revealed by scrolling the body alone if the keyboard would hide it; the composer keeps the bottom edge in view. The close is bounded by the next focus, not a timer.
- **Native picker passthrough**:
  Only the inputs that raise a keyboard open the shell; `<input type="date">`, `<select>` and buttons keep their native behaviour.

---

## 🧭 One layout

`PageLayout` is the only layout since v2.0.0. A chat screen is the same layout with the reader at the end of the document: it is the app shell the moment the composer is tapped and an ordinary page — URL bar collapsing — until then. (The v1 `SubpageLayout`, the shell on its own, is preserved in the showcase's lab archive as EXP-04-A.)

`PageLayout` owns `html`/`body` overflow while mounted; do not lock them yourself.

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
import { PageLayout, FloatingInput, type PageLayoutHandle } from 'react-mobile-keyboard-layout'
import 'react-mobile-keyboard-layout/dist/index.css'

export default function ChatScreen() {
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<string[]>([])
  const layout = useRef<PageLayoutHandle>(null)

  const handleSend = () => {
    if (!text.trim()) return
    setMessages((prev) => [...prev, text.trim()])
    setText('')
    layout.current?.scrollToBottom('smooth')
  }

  return (
    <PageLayout
      ref={layout}
      title="Conversation"
      footer={({ isKeyboardOpen }) => (
        <FloatingInput
          value={text}
          onChange={setText}
          onSubmit={handleSend}
          placeholder="Write a message..."
          isKeyboardOpen={isKeyboardOpen}
        />
      )}
    >
      <div style={{ padding: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} className="message-bubble">
            {msg}
          </div>
        ))}
      </div>
    </PageLayout>
  )
}
```

- `footer` may be a node or a function; the function receives `{ isKeyboardOpen, keyboardHeight, keyboardInset }`.
- `ref` gives `{ element, scrollToBottom(behavior?) }` — `scrollToBottom` scrolls the document while idle and the shell's scroller while the shell is up.
- `usePageKeyboard()` is exported for anything else that wants the keyboard state (a HUD, an analytics hook); the layout does not need you to call it.

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
