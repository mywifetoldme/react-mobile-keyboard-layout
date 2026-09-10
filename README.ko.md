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

`react-mobile-keyboard-layout`은 레이아웃 하나로 이 문제를 다룹니다. 인풋을 탭하기 전까지는 보통 웹페이지처럼 스크롤되고, 키보드가 떠 있는 동안은 앱 셸인 페이지. CSS와 표준 웹 API 둘(`visualViewport`, `preventScroll`), **외부 의존성 0**, 그리고 명세가 주지 않는 숫자는 정확히 하나.

---

## 🎯 핵심 구조 및 접근법

- **상태 둘, 속성 하나**:
  대기 중엔 문서가 스크롤되고 Safari 주소창이 접힙니다. 헤더와 작성기는 `position: sticky`로 흐름 안에 있습니다. 셸의 열쇠는 루트의 속성 하나 `data-rmkl-shell`이고, 나머지는 PageLayout.css가 합니다: `position: fixed` 셸, 고정 헤더, 같은 읽던 위치의 `column-reverse` 본문 스크롤러, 키보드 인셋 위의 작성기. 상태 기계는 없습니다.
- **탭이 셸을 먼저 만들고, 그 다음 포커스**:
  Safari는 캐럿을 어디로 드러낼지 인풋이 포커스되는 순간 정합니다. 그래서 레이아웃은 `pointerup`에서 문서 오프셋을 발표하고, 속성을 세팅하고, 셸을 배치하고, 오프셋을 본문 스크롤러에 건넨 뒤 -- 그때 포커스합니다. Safari는 인풋을 셸 자체의 스크롤러 안에서 발견하고 밀 것이 없습니다(실기기: 셸이 `:focus`에 걸렸을 때 48회 중 9회 밀림, 속성에 걸었을 때 47회 중 0회).
- **문서는 캡될 뿐, `position: fixed`는 절대 아님**:
  셸이 떠 있는 동안 문서는 `calc(오프셋 + 100lvh)` 높이에 `overflow: hidden`입니다. 오프셋이 유지되고, Safari 주소창은 그대로이며, blur 시 문서는 독자가 두고 간 자리에 정확히 있습니다. body를 fixed로 잠그면 오프셋이 리셋되고 Safari가 손가락 아래에서 주소창을 다시 펼칩니다. Safari가 그래도 윈도우를 움직이면 숫자 없는 가드가 되돌립니다.
- **키보드 높이는 CSS 변수로**:
  CSS가 읽을 수 없는 유일한 값을 `--rmkl-kb`로, 그중 레이아웃 뷰포트가 가려진 만큼을 `--rmkl-kb-inset`으로 내보냅니다(`innerHeight − visualViewport.height × scale`; 레이아웃 뷰포트 자체가 줄어드는 브라우저는 `innerHeight` 감소분). `resize`뿐 아니라 `scroll`에서도 잽니다 -- iOS는 스스로 밀고 난 뒤 `innerHeight`를 resize 이벤트 없이 되돌립니다.
- **읽던 위치 유지**:
  본문은 아래에서부터 스크롤합니다(`flex-direction: column-reverse`, 자식은 DOM 순서 그대로). 포커스된 본문 인풋은 키보드가 자리를 차지해도 화면 위치를 지키고, 가려질 땐 본문만 스크롤해 드러냅니다. 작성기는 하단 가장자리를 유지합니다. 닫힘의 끝은 타이머가 아니라 다음 포커스입니다.
- **네이티브 피커 분기**:
  키보드를 띄우는 인풋만 셸을 엽니다. `<input type="date">`, `<select>`, 버튼은 네이티브 동작 그대로입니다.

---

## 🧭 레이아웃 하나

v2.0.0부터 `PageLayout`이 유일한 레이아웃입니다. 채팅 화면은 독자가 문서 끝에 있는 같은 레이아웃입니다. 작성기를 탭하는 순간 앱 셸이 되고, 그 전까지는 주소창이 접히는 보통 페이지입니다. (v1의 `SubpageLayout` -- 셸 단독 -- 은 showcase 랩 아카이브에 EXP-04-A로 보존됩니다.)

`PageLayout`은 마운트 중 `html`/`body` overflow를 소유하니 직접 잠그지 마세요.

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
      title="대화방"
      footer={({ isKeyboardOpen }) => (
        <FloatingInput
          value={text}
          onChange={setText}
          onSubmit={handleSend}
          placeholder="메시지를 입력하세요..."
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

- `footer`는 노드 또는 함수. 함수는 `{ isKeyboardOpen, keyboardHeight, keyboardInset }`을 받습니다.
- `ref`는 `{ element, scrollToBottom(behavior?) }`를 줍니다 -- `scrollToBottom`은 대기 중엔 문서를, 셸 중엔 셸의 스크롤러를 스크롤합니다.
- 키보드 상태가 필요한 다른 곳(HUD, 분석 훅)을 위해 `usePageKeyboard()`를 내보냅니다. 레이아웃 자체는 여러분이 그것을 부를 필요가 없습니다.

---

## 📱 테스트 환경 및 피드백

- **검증 환경**: CSS-first 레이아웃은 iOS 26 시뮬레이터(Mobile Safari)에서 영상을 프레임 단위로 재서 확인했고, Android 16 에뮬레이터의 Android Chrome 133에서 소프트 키보드(Gboard)로 다시 쟀습니다 — AVD를 `hw.keyboard=no`로 콜드 부팅해야 IME 인셋이 나옵니다. Chrome for iOS는 시뮬레이터에 설치할 수 없어, Chrome이 쓸 수밖에 없는 엔진(WKWebView)만 띄운 최소 앱으로 대리 측정했습니다(Chrome 자체 툴바·제스처는 이 대리 측정에 빠져 있고, 실기 Chrome for iOS 앱은 아직 미검증입니다). 세 환경 모두에서 하단 입력바와 본문 맨 아래 입력이 정상적으로 열리고 닫혔으며 포커스 전 위치로 돌아왔습니다. 이전 엔진 기반 버전은 iOS 26 및 27 beta 실기기(Mobile Safari, PWA Standalone Mode, iOS Chrome), Android Chrome, 데스크톱 Chrome/Safari에서 확인됐으며, 실기기 재검증 제보를 환영합니다.
- **브라우저 지원**: CSS `:has()`가 필요합니다(Safari 15.4+, Chrome 105+, Firefox 121+).
- **참고사항**: 서드파티 키보드 앱이나 특수한 스플릿 뷰 환경에서는 동작 차이가 있을 수 있습니다. 다양한 기기에서의 테스트 피드백과 이슈 제보는 언제나 환영합니다.

---

## 📄 라이선스

MIT © [Clubsandwich](https://github.com/mywifetoldme)
