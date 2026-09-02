# react-mobile-keyboard-layout

[![npm version](https://img.shields.io/npm/v/react-mobile-keyboard-layout.svg?color=blue)](https://www.npmjs.com/package/react-mobile-keyboard-layout)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success.svg)](#)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Cloudflare_Pages-F38020.svg?logo=cloudflare)](https://react-mobile-keyboard-layout.pages.dev/)

> **상단 헤더 흔들림 제로, 0.0px 스크롤 앵커링, 매끄러운 플로팅 입력을 제공하는 React 모바일 키보드 레이아웃 라이브러리.**
>
> 📱 **인터랙티브 라이브 데모**: [https://react-mobile-keyboard-layout.pages.dev/](https://react-mobile-keyboard-layout.pages.dev/)

[English](./README.md) | [한국어]

---

## ⚡ 모바일 웹 키보드의 주요 문제점

모바일 브라우저(특히 **iOS 사파리 / 웹킷**)에서는 가상 키보드가 열릴 때 다음과 같은 레이아웃 문제가 자주 발생합니다:
1. **상단 헤더 밀림/흔들림**: 뷰포트 수축 시 고정 헤더가 흔들리거나 화면 밖으로 밀려남.
2. **보던 위치 점프**: 인풋 터치 시 브라우저 자동 스크롤로 인해 읽고 있던 줄 위치가 급격히 바뀜.
3. **34px 하단 갭**: 바닥 고정 인풋창이 홈바 위로 34px 떠서 빈 공간 발생.
4. **네이티브 피커 닫힘 현상**: 스크롤 락 로직이 날짜/시간 피커(`<input type="date">`)를 즉시 닫아버리는 문제.

`react-mobile-keyboard-layout`은 외부 라이브러리 없이 **표준 W3C 웹 API(`visualViewport`, `ResizeObserver`, `preventScroll`)를 활용하여 레이아웃을 안정화**합니다.

---

## 🎯 핵심 구조 및 접근법

- **0.0px 좌표 보정 수식 (Coordinate Preservation)**:
  $$\Delta H = H_{\text{closed}} - H_{\text{current}}$$
  $$S_{\text{new}} = S_0 + \Delta H$$
  컨테이너 바닥이 수축하는 만큼 `scrollTop`을 보정하여, 키보드가 팝업되어도 읽고 있던 텍스트 위치를 안정적으로 유지.
- **물리적 독립 헤더 격리 (Isolated Static Header)**:
  헤더를 리사이징 컨테이너 밖에 배치하여 레이아웃 리플로우로 인한 흔들림을 차단.
- **120Hz rAF 연속 윈도우 탑락 (Top-Lock Loop)**:
  키보드가 올라오는 350ms 동안 모니터 주사율에 맞춰 `window.scrollY = 0`을 유지.
- **3-상태 포커스 핸드오버 FSM (State Machine)**:
  본문 인라인 폼과 하단 플로팅 바 간의 포커스 이동 시 깜빡임 방지.
- **네이티브 피커 분기 (Picker Passthrough)**:
  가상 키보드 텍스트 입력창과 OS 모달 시트(날짜/시간 피커)를 구분하여 자연스러운 동작 보장.

---

## 📦 설치

```bash
npm install react-mobile-keyboard-layout
# 또는
pnpm add react-mobile-keyboard-layout
# 또는
yarn add react-mobile-keyboard-layout
```

---

## 🚀 빠른 시작 (Quick Start)

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
      title="대화방"
      footer={
        <FloatingInput
          value={text}
          onChange={setText}
          onSubmit={handleSend}
          placeholder="메시지를 입력하세요..."
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

## 📱 테스트 환경 및 피드백

- **실기기 테스트 환경**: iOS 26 및 27 beta 실기기(Mobile Safari, PWA Standalone Mode, iOS Chrome), Android Chrome, 데스크톱 Chrome/Safari.
- **참고사항**: 서드파티 키보드 앱이나 특수한 스플릿 뷰 환경에서는 동작 차이가 있을 수 있습니다. 다양한 기기에서의 테스트 피드백과 이슈 제보는 언제나 환영합니다.

---

## 📄 라이선스

MIT © [Clubsandwich](https://github.com/mywifetoldme)
