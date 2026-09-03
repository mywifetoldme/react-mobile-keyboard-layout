# react-mobile-keyboard-layout

[![npm version](https://img.shields.io/npm/v/react-mobile-keyboard-layout.svg?color=blue)](https://www.npmjs.com/package/react-mobile-keyboard-layout)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success.svg)](#)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Cloudflare_Pages-F38020.svg?logo=cloudflare)](https://react-mobile-keyboard-layout.pages.dev/)

> **상단 헤더 흔들림 제로, 0.0px 스크롤 앵커링, 매끄러운 플로팅 입력을 제공하는 React 모바일 키보드 레이아웃 라이브러리.**
>
> 📱 **인터랙티브 라이브 데모**: [https://react-mobile-keyboard-layout.pages.dev/](https://react-mobile-keyboard-layout.pages.dev/)
>
> ⚠️ **중요 안내**: 이 라이브러리는 터치 디바이스의 소프트웨어 가상 키보드 환경(**iOS Safari**, 안드로이드 크롬, 모바일 PWA)에서 발생하는 레이아웃 왜곡을 제어하도록 특화되어 있습니다. 데스크톱에서는 가상 키보드가 동작하지 않으므로, **반드시 실제 스마트폰(아이폰 권장)이나 모바일 에뮬레이터에서 열어주세요.**

<p align="center">
  <a href="https://react-mobile-keyboard-layout.pages.dev/">
    <img src="./docs/assets/demo-qr.png" alt="모바일 데모 열기 QR 코드" width="140" height="140" />
  </a>
  <br />
  <sub>📱 스마트폰 카메라로 QR 코드를 스캔하여 라이브 데모 열기</sub>
</p>

[English](./README.md) | [한국어]

---

## ⚡ 모바일 웹 키보드의 주요 문제점

모바일 브라우저(특히 **iOS 사파리 / 웹킷**)에서는 가상 키보드가 열릴 때 다음과 같은 레이아웃 문제가 자주 발생합니다:
1. **상단 헤더 밀림/흔들림**: 뷰포트 수축 시 고정 헤더가 흔들리거나 화면 밖으로 밀려남.
2. **보던 위치 점프**: 인풋 터치 시 브라우저 자동 스크롤로 인해 읽고 있던 줄 위치가 급격히 바뀜.
3. **34px 하단 갭**: 바닥 고정 인풋창이 홈바 위로 34px 떠서 빈 공간 발생.
4. **네이티브 피커 닫힘 현상**: 스크롤 락 로직이 날짜/시간 피커(`<input type="date">`)를 즉시 닫아버리는 문제.

`react-mobile-keyboard-layout`은 외부 라이브러리 없이 **CSS(`:has()`, `:focus-within`)와 표준 웹 API 둘(`visualViewport`, `preventScroll`)만으로 레이아웃을 안정화**합니다.

---

## 🎯 핵심 구조 및 접근법

- **키보드 상태는 CSS가 판정**:
  키보드가 열렸는지, 포커스가 본문 폼에 있는지 하단 플로팅 바에 있는지, 네이티브 피커가 열렸는지를 전부 스타일시트의 셀렉터(`:focus-within`, `:has()`)로 읽는다. 어긋날 JS 상태 기계가 없다.
- **물리적 독립 헤더 격리 (Isolated Static Header)**:
  헤더를 리사이징 컨테이너 밖에 배치하여 레이아웃 리플로우로 인한 흔들림을 차단.
- **되돌리기 대신 탭 가로채기**:
  텍스트 입력은 `pointerdown`에서 `preventScroll: true`로 직접 포커스해, iOS가 창을 밀어 올리기 전에 끝낸다. 350ms rAF 탑락은 보험으로만 남는다. iOS 26에서 영상을 프레임 단위로 재보면, 밀린 뒤 되돌리는 방식은 항상 약 240ms 헤더 튐이 남는다.
- **키보드 높이는 CSS 변수로**:
  CSS가 읽을 수 없는 유일한 값 `innerHeight - visualViewport.height`를 `--rmkl-kb`로 내보내 아래 여백으로 잡는다. 블러 시엔 지연되는 `visualViewport` resize를 기다리지 않고 `:not(:focus-within)`으로 즉시 되돌아간다.
- **읽던 위치는 브라우저가 유지**:
  본문은 아래에서부터 스크롤한다(`flex-direction: column-reverse`, 자식은 DOM 순서 그대로). 컨테이너가 줄어도 읽던 메시지가 그 자리에 있다.
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

## 📱 테스트 환경 및 피드백

- **검증 환경**: CSS-first 레이아웃은 iOS 26 시뮬레이터(Mobile Safari)에서 영상을 프레임 단위로 재서 확인했습니다. 이전 엔진 기반 버전은 iOS 26 및 27 beta 실기기(Mobile Safari, PWA Standalone Mode, iOS Chrome), Android Chrome, 데스크톱 Chrome/Safari에서 확인됐으며, 실기기 재검증 제보를 환영합니다.
- **브라우저 지원**: CSS `:has()`가 필요합니다(Safari 15.4+, Chrome 105+, Firefox 121+).
- **참고사항**: 서드파티 키보드 앱이나 특수한 스플릿 뷰 환경에서는 동작 차이가 있을 수 있습니다. 다양한 기기에서의 테스트 피드백과 이슈 제보는 언제나 환영합니다.

---

## 📄 라이선스

MIT © [Clubsandwich](https://github.com/mywifetoldme)
