# engine-v1.0 — Phase 3-D 이후 실험들의 엔진 사본 (수정 금지)

EXP-03-D/E, EXP-04-A, EXP-04-B는 살아있는 패키지가 아니라 이 사본 위에서 돕니다. 패키지가 바뀌어도
실험은 사본이 갱신될 때까지 그대로이고, 갱신은 의도적인 행위(아래 명령으로 다시 뜨기)입니다.
(EXP-03-F가 `engine-v0.2/`로 격리된 것과 같은 방식입니다.)

EXP-04-B는 아직 완결되지 않았으므로 **라이브러리와 같은 코드**를 유지합니다: 랩은 이 사본의 `PageLayout`을
그대로 렌더하고, 파인딩이 패키지에 들어갈 때마다 사본을 다시 떠서 랩과 라이브러리가 한 코드가 되게 합니다.

## 출처

- 커밋: `5acad74` (v1.0.0 + PR #23: `PageLayout`, `FloatingInput` pointerup 포커스, `useMobileKeyboard` 수정들)
  - `lockDurationMs: 0`이 보험용 탑락을 완전히 끔
  - 플로팅 바 포커스 중 column-reverse 본문의 하단 가장자리를 붙잡음 (WebKit은 scrollTop 0에서만 하단 고정) — 본문 인풋 blur 유예창 안에서도
  - 키보드에 가려진 본문 인풋을 `<main>`만 부드럽게 스크롤해 드러냄 (scrollIntoView는 문서까지 밀 수 있음)
  - PageLayout의 문서 캡이 `calc(offset + 100%)`: 사파리가 키보드와 함께 레이아웃 뷰포트를 줄여도(695→396 측정) 스크롤 여지가 0
  - 그래도 사파리의 캐럿 리빌은 문서 최대치를 넘어 윈도우를 밀므로(측정 offset+94/+299, 시각 뷰포트 40px), 잠금 중 밀리면 발표한 오프셋으로 되돌림 (04-A의 lockWindowTop을 0 대신 읽던 위치로 일반화, 타이머 대신 이벤트)
- 원본 경로: `packages/react-mobile-keyboard-layout/src/`
- 복사한 파일: `components/SubpageLayout.tsx` `components/SubpageLayout.css`
  `components/PageLayout.tsx` `components/PageLayout.css`
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
         components/PageLayout.tsx components/PageLayout.css \
         components/FloatingInput.tsx components/FloatingInput.css \
         hooks/useMobileKeyboard.ts utils/isKeyboardTextInput.ts index.ts; do
  git show "5acad74:packages/react-mobile-keyboard-layout/src/$p" \
    | sed 's/rmkl-/rmkl-v10-/g' | diff -q - "apps/showcase/src/labs/engine-v1.0/$p"
done
```

## 수정 금지

이 폴더는 **수정 금지**입니다. 버그를 고치거나 기능을 더하지 마세요.
고칠 일은 `packages/react-mobile-keyboard-layout/`에서 하고, 그 결과를 이 사본에 반영하려면
사본을 다시 뜨세요(위 명령의 커밋을 갱신). EXP-04-B가 완결되면 사본을 그 시점에 얼리고,
다음 실험은 새 사본(`engine-v1.x/`)을 떠서 시작합니다.
