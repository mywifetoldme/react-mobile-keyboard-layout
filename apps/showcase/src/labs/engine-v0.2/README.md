# engine-v0.2 — EXP-03-F 격리 사본 (수정 금지)

EXP-03-F는 엔진 시절의 최종형이라 그때 동작 그대로 남겨야 하는 기록물입니다.
현재 패키지는 CSS-first로 바뀌면서 `alignPadding`·`isFloatingSuppressed`가 없어졌기 때문에,
EXP-03-F를 현재 API로 옮기면 그때의 동작이 아니게 됩니다.
그래서 v0.2.0 시절의 `src/`를 통째로 복사해 여기에 두고, EXP-03-F 샌드박스만 이 사본을 씁니다.

## 출처

- 커밋: `03c867d00cb13ddbc2ee67cb1d8232fc2ceb0e45` (v0.2.0)
- 원본 경로: `packages/react-mobile-keyboard-layout/src/`
- 복사한 파일: `core/layoutEngine.ts` `core/layoutRules.ts` `core/layoutTypes.ts`
  `hooks/useMobileKeyboard.ts` `components/SubpageLayout.tsx` `components/SubpageLayout.css`
  `components/FloatingInput.tsx` `components/FloatingInput.css` `utils/isKeyboardTextInput.ts` `index.ts`
  (테스트 파일은 복사하지 않았습니다 — 패키지 쪽에 그대로 있습니다.)

## 치환 규칙

클래스 이름과 CSS 변수의 `rmkl-` 접두를 전부 `rmkl-v02-`로 바꿨습니다.
현재 패키지의 스타일시트가 이 사본에 스며들지 않게 하기 위한 것이고, 그 외에는 한 글자도 바꾸지 않았습니다.

재현·검증 명령:

```sh
for p in core/layoutEngine.ts core/layoutRules.ts core/layoutTypes.ts hooks/useMobileKeyboard.ts \
         components/SubpageLayout.tsx components/SubpageLayout.css \
         components/FloatingInput.tsx components/FloatingInput.css \
         utils/isKeyboardTextInput.ts index.ts; do
  git show "03c867d00cb13ddbc2ee67cb1d8232fc2ceb0e45:packages/react-mobile-keyboard-layout/src/$p" \
    | sed 's/rmkl-/rmkl-v02-/g' | diff -q - "apps/showcase/src/labs/engine-v0.2/$p"
done
```

## 수정 금지

이 폴더는 **수정 금지**입니다. 버그를 고치거나 기능을 더하지 마세요.
v0.2.0 그 시점의 동작을 보존하는 것이 이 폴더의 유일한 목적이라,
한 줄이라도 고치면 EXP-03-F가 더 이상 그때의 EXP-03-F가 아닙니다.
현재 동작을 고칠 일은 `packages/react-mobile-keyboard-layout/`에서 하고,
그 결과는 EXP-04-A 샌드박스로 보면 됩니다.
