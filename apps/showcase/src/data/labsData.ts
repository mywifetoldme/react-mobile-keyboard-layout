export interface LocalizedString {
  en: string
  ko: string
}

export interface LabInfo {
  id: string
  status: 'failed' | 'progress' | 'winner'
  title: LocalizedString
  description: LocalizedString
  keyFinding: LocalizedString
}

export const LABS_DATA: LabInfo[] = [
  {
    id: 'exp01',
    status: 'failed',
    title: {
      en: 'EXP-01: Naive Fixed Bottom Bar',
      ko: 'EXP-01: 단순 position: fixed 하단 바',
    },
    description: {
      en: 'Standard CSS position: fixed without keyboard awareness.',
      ko: '키보드 처리가 전혀 없는 표준 CSS position: fixed 구조.',
    },
    keyFinding: {
      en: 'Virtual keyboard covers the input completely on iOS Safari.',
      ko: 'iOS 사파리에서 가상 키보드가 입력창을 완전히 가려버림.',
    },
  },
  {
    id: 'exp01_a',
    status: 'failed',
    title: {
      en: 'EXP-01-A: visualViewport Resize',
      ko: 'EXP-01-A: visualViewport 리사이즈 감지',
    },
    description: {
      en: 'Listening to visualViewport.resize and setting container height.',
      ko: 'visualViewport.resize를 감지하여 컨테이너 높이를 축소.',
    },
    keyFinding: {
      en: 'Causes 34px gap above home bar and sudden 100px reading line jump.',
      ko: '하단 홈바 위 34px 빈 공간 발생 및 100px 스크롤 급발진 발생.',
    },
  },
  {
    id: 'exp01_b',
    status: 'failed',
    title: {
      en: 'EXP-01-B: Fixed 100dvh Unit',
      ko: 'EXP-01-B: CSS 100dvh 단위 적용',
    },
    description: {
      en: 'Using modern CSS dynamic viewport unit 100dvh.',
      ko: '최신 CSS 동적 뷰포트 단위 100dvh 적용.',
    },
    keyFinding: {
      en: 'dvh does not react synchronously during iOS keyboard transition animation.',
      ko: 'iOS 키보드 애니메이션 중에는 dvh가 동기적으로 반응하지 않음.',
    },
  },
  {
    id: 'exp02',
    status: 'failed',
    title: {
      en: 'EXP-02: Body Scroll Lock',
      ko: 'EXP-02: 바디 스크롤 락 시도',
    },
    description: {
      en: 'Setting overflow: hidden and fixed body positioning on focus.',
      ko: '포커스 시 overflow: hidden 및 바디 고정 적용.',
    },
    keyFinding: {
      en: 'Severe layout clipping and scroll position reset to 0 upon blur.',
      ko: '레이아웃 잘림 및 포커스 해제 시 스크롤이 강제로 0으로 리셋됨.',
    },
  },
  {
    id: 'exp02_a',
    status: 'failed',
    title: {
      en: 'EXP-02-A: Programmatic Scroll Restoration',
      ko: 'EXP-02-A: 프로그래밍 방식 스크롤 복원',
    },
    description: {
      en: 'Capturing scrollTop before focus and restoring it with requestAnimationFrame.',
      ko: '포커스 전 scrollTop을 저장하고 rAF로 복원 시도.',
    },
    keyFinding: {
      en: 'Visible 1-frame jitter where content flashes before snapping back.',
      ko: '1프레임 동안 화면이 튕겼다가 돌아오는 깜빡임 발생.',
    },
  },
  {
    id: 'exp02_b',
    status: 'progress',
    title: {
      en: 'EXP-02-B: Focus preventScroll Interception',
      ko: 'EXP-02-B: preventScroll 포커스 가로채기',
    },
    description: {
      en: 'Intercepting pointerdown to call element.focus({ preventScroll: true }).',
      ko: 'pointerdown을 가로채 preventScroll: true로 포커스 선점.',
    },
    keyFinding: {
      en: 'Successfully eliminates WebKit auto-scrollIntoView on touch.',
      ko: '사파리 웹킷의 자동 scrollIntoView 화면 점프를 최초로 차단 성공.',
    },
  },
  {
    id: 'exp02_c',
    status: 'progress',
    title: {
      en: 'EXP-02-C: Continuous 120Hz rAF Top-Lock',
      ko: 'EXP-02-C: 연속 120Hz rAF 윈도우 탑락',
    },
    description: {
      en: 'Clamping window.scrollY = 0 frame-by-frame during the 350ms keyboard slide.',
      ko: '키보드가 올라오는 350ms 동안 매 프레임 window.scrollY = 0 고정.',
    },
    keyFinding: {
      en: 'Window scroll remains locked at 0.0px with zero background rubberbanding.',
      ko: '윈도우 스크롤이 0.0px에 완벽 고정되며 배경 밀림 완전 박멸.',
    },
  },
  {
    id: 'exp02_d',
    status: 'progress',
    title: {
      en: 'EXP-02-D: Dynamic Delta-H Tracking',
      ko: 'EXP-02-D: 동적 Delta-H 높이 추적',
    },
    description: {
      en: 'Tracking container resize delta with ResizeObserver.',
      ko: 'ResizeObserver로 컨테이너 크기 변화량(Delta-H) 실시간 추적.',
    },
    keyFinding: {
      en: 'Provided the foundation for mathematical coordinate compensation.',
      ko: '수학적 좌표 보정 수식의 핵심 기틀 마련.',
    },
  },
  {
    id: 'exp03_a',
    status: 'progress',
    title: {
      en: 'EXP-03-A: Dual Input Conflict Resolution',
      ko: 'EXP-03-A: 복수 인풋 충돌 제어',
    },
    description: {
      en: 'Managing conflicts between body form inputs and bottom floating input.',
      ko: '본문 폼 인풋과 하단 플로팅 인풋 간의 충돌 제어.',
    },
    keyFinding: {
      en: 'Floating bar safely suppresses when inline body input is focused.',
      ko: '본문 폼 입력 시 플로팅 바가 겹치지 않고 자연스럽게 숨겨짐.',
    },
  },
  {
    id: 'exp03_b',
    status: 'progress',
    title: {
      en: 'EXP-03-B: 3-State Focus Handover FSM',
      ko: 'EXP-03-B: 3-상태 포커스 핸드오버 FSM',
    },
    description: {
      en: 'Finite State Machine: activeInputType = none | floating | body.',
      ko: '유한 상태 머신으로 인풋 간 포커스 이동 시 깜빡임 차단.',
    },
    keyFinding: {
      en: 'Completely eliminates transition flicker when switching inputs.',
      ko: '인풋 간 포커스 이동 시 닫힘 깜빡임 완전 제거.',
    },
  },
  {
    id: 'exp03_c',
    status: 'progress',
    title: {
      en: 'EXP-03-C: Coordinate Preservation Formula',
      ko: 'EXP-03-C: 0.0px 좌표 보정 수식 완성',
    },
    description: {
      en: 'Mathematical compensation: S_new = S_0 + (H_closed - H_current).',
      ko: '기하학 보정 수식 S_new = S_0 + (H_closed - H_curr) 도출.',
    },
    keyFinding: {
      en: 'Reading line stays 100% frozen in place with 0.0px error on keyboard popup.',
      ko: '키보드가 열려도 보던 줄이 0.0px 오차 없이 완벽히 화면에 고정.',
    },
  },
  {
    id: 'exp03_d',
    status: 'winner',
    title: {
      en: 'EXP-03-D: Isolated Static Header & Zero-Shift Master',
      ko: 'EXP-03-D: 독립 헤더 격리 & Zero-Shift 완성형 (Winner)',
    },
    description: {
      en: 'Decoupled physical static header outside resizing viewport + smart bottom sync.',
      ko: '리사이징 컨테이너 밖으로 헤더를 물리적 격리 + 스마트 바닥 동기화.',
    },
    keyFinding: {
      en: 'Native App Parity achieved! 0.0px header jitter, 8px snap, 0.0px reading anchor.',
      ko: '네이티브 앱 동등 수준 달성! 헤더 흔들림 0.0px, 8px 초밀착, 0.0px 앵커링.',
    },
  },
]
