# engine-v2.0 — EXP-04-B의 엔진 사본 (수정 금지)

EXP-04-B(최종 선택, 패키지 2.0.0의 `PageLayout`)는 살아있는 패키지가 아니라 이 사본 위에서 돕니다.
패키지가 바뀌어도 실험은 사본이 갱신될 때까지 그대로이고, 갱신은 의도적인 행위(아래 명령으로 다시 뜨기)입니다.
(EXP-03-F가 `engine-v0.2/`, EXP-03-D/E·04-A가 `engine-v1.0/`에 격리된 것과 같은 방식입니다.)

- 커밋: `91f0b03` (v2.0.0: `PageLayout` + `usePageKeyboard` + `FloatingInput`)
- 원본 경로: `packages/react-mobile-keyboard-layout/src/`
- 복사한 파일: `components/PageLayout.tsx` `components/PageLayout.css` `components/FloatingInput.tsx` `components/FloatingInput.css` `hooks/usePageKeyboard.ts` `utils/isKeyboardTextInput.ts` `index.ts` `css-raw.d.ts`

클래스 이름·CSS 변수·데이터 속성의 `rmkl-` 접두를 전부 `rmkl-v20-`로 바꿨습니다(`data-rmkl-v20-shell`, `--rmkl-v20-page-lock-y`).

## 사본이 원본과 같은지 확인

```sh
for p in components/PageLayout.tsx components/PageLayout.css components/FloatingInput.tsx components/FloatingInput.css hooks/usePageKeyboard.ts utils/isKeyboardTextInput.ts index.ts css-raw.d.ts; do
  git show "91f0b03:packages/react-mobile-keyboard-layout/src/$p" \
    | sed 's/rmkl-/rmkl-v20-/g' | diff -q - "apps/showcase/src/labs/engine-v2.0/$p"
done
```

## 수정하지 마세요

한 줄이라도 고치면 EXP-04-B가 더 이상 그때의 실험이 아닙니다.
고칠 일은 `packages/react-mobile-keyboard-layout/`에서 하고, 결과를 랩에 반영하려면 사본을 다시 뜨세요(위 커밋을 갱신).
