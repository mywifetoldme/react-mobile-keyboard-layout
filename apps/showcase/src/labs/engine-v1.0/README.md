# engine-v1.0 — EXP-04-A / EXP-04-B 격리 사본 (수정 금지)

EXP-04-A(CSS-first 통합)와 EXP-04-B(윈도우 스크롤 개방)는 이 시점의 엔진 동작을 그대로 보여주는
기록물이어야 하므로, `packages/react-mobile-keyboard-layout/src/`를 통째로 복사해 여기에 두고
두 샌드박스만 이 사본을 씁니다. 패키지가 앞으로 어떻게 바뀌어도 두 실험은 그때의 결론을 재현합니다.
(EXP-03-F가 `engine-v0.2/`로 격리된 것과 같은 방식입니다.)

## 출처

- 커밋: `3c0f62d` (v1.0.0에 PR #23의 `useMobileKeyboard` 수정 둘을 더한 상태)
  - `lockDurationMs: 0`이 보험용 탑락을 완전히 끔
  - 플로팅 바 포커스 중 column-reverse 본문의 하단 가장자리를 붙잡음 (WebKit은 scrollTop 0에서만 하단 고정)
- 원본 경로: `packages/react-mobile-keyboard-layout/src/`
- 복사한 파일: `components/SubpageLayout.tsx` `components/SubpageLayout.css`
  `components/FloatingInput.tsx` `components/FloatingInput.css`
  `hooks/useMobileKeyboard.ts` `utils/isKeyboardTextInput.ts` `index.ts`
  (테스트 파일과 `css-raw.d.ts`는 복사하지 않았습니다 — 패키지 쪽에 그대로 있습니다.)

## 치환 규칙

클래스 이름과 CSS 변수의 `rmkl-` 접두를 전부 `rmkl-v10-`로 바꿨습니다.
현재 패키지의 스타일시트가 이 사본에 스며들지 않게 하기 위한 것이고, 그 외에는 한 글자도 바꾸지 않았습니다.
샌드박스 쪽에서 엔진의 CSS 변수를 참조할 때는 문자열을 적지 말고 `KEYBOARD_INSET_CSS_VAR` 같은
내보낸 상수를 쓰세요 — 접두가 바뀐 사본에서도 그대로 맞습니다.

재현·검증 명령:

```sh
for p in components/SubpageLayout.tsx components/SubpageLayout.css \
         components/FloatingInput.tsx components/FloatingInput.css \
         hooks/useMobileKeyboard.ts utils/isKeyboardTextInput.ts index.ts; do
  git show "3c0f62d:packages/react-mobile-keyboard-layout/src/$p" \
    | sed 's/rmkl-/rmkl-v10-/g' | diff -q - "apps/showcase/src/labs/engine-v1.0/$p"
done
```

## 수정 금지

이 폴더는 **수정 금지**입니다. 버그를 고치거나 기능을 더하지 마세요.
한 줄이라도 고치면 EXP-04-A/B가 더 이상 그때의 실험이 아닙니다.
현재 동작을 고칠 일은 `packages/react-mobile-keyboard-layout/`에서 하고,
그 결과는 Playground(현재 패키지)로 보면 됩니다. 다음 실험은 새 사본(`engine-v1.x/`)을 떠서 시작하세요.
