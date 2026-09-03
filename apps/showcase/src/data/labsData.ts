export interface LocalizedString {
  en: string
  ko: string
}

export interface EvaluationItem {
  id: '1-1' | '1-2' | '1-3' | '1-4' | '2-1' | '3-1'
  status: 'pass' | 'fail' | 'na'
  comment: LocalizedString
}

export interface LabInfo {
  id: string
  status: 'failed' | 'progress' | 'winner'
  title: LocalizedString
  hypothesis: LocalizedString
  evaluations: EvaluationItem[]
  keyFinding: LocalizedString
  nextDecision: LocalizedString
}

export const LABS_DATA: LabInfo[] = [
  /* ==========================================================================
     PHASE 1: Pure CSS Limits (순수 CSS의 한계 검증)
     ========================================================================== */
  {
    id: 'exp01_a',
    status: 'failed',
    title: {
      en: 'EXP-01-A: Baseline Standard Fixed',
      ko: 'EXP-01-A: 순수 CSS position: fixed 기준점',
    },
    hypothesis: {
      en: 'Standard CSS position: fixed with safe-area padding can anchor the input at the bottom on iOS Safari.',
      ko: '표준 CSS position: fixed와 Safe Area Inset(34px, 홈 바 여백)만으로 iOS 사파리에서 인풋이 바닥에 안정적으로 유지되는지 검증한다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Header pushed off-screen as Safari pans window up', ko: '사파리가 외부 창을 밀어올려 상단 헤더가 화면 위로 사라짐' } },
      { id: '1-2', status: 'fail', comment: { en: 'Dual-scroll occurs when scrolling on input area', ko: '인풋 영역 스크롤 시 이중 스크롤 발생' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Home Indicator inset remains above keyboard as dead space', ko: '키보드 활성화 시 홈 인디케이터 여백(34px)이 키보드 위에 빈 공간으로 잔존' } },
      { id: '1-4', status: 'pass', comment: { en: 'Safari pans window up, naturally keeping body bottom above input', ko: '사파리가 창을 올려 바디 하단 위치가 인풋 위에 자연 보존됨' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'position: fixed structure causes top header loss, dual-scroll collision on input dragging, and leaves an unnecessary 34px Safe Area Inset gap (Home Indicator space) above the keyboard.',
      ko: 'position: fixed 구조에서는 사파리의 뷰포트 이동으로 인해 상단 헤더가 화면 밖으로 밀려나고, 인풋 터치 시 이중 스크롤이 발생하며, 키보드가 열려도 홈 인디케이터 영역(34px)이 키보드 위에 불필요한 데드 스페이스로 그대로 남음.',
    },
    nextDecision: {
      en: 'Branch into EXP-01-B to try removing the 34px Safe Area Inset gap dynamically while keeping position: fixed.',
      ko: 'position: fixed를 유지한 채 키보드 위 34px Safe Area Inset 공백을 동적으로 제거해보는 EXP-01-B로 연계.',
    },
  },
  {
    id: 'exp01_b',
    status: 'failed',
    title: {
      en: 'EXP-01-B: Dynamic Safe Area Inset',
      ko: 'EXP-01-B: Safe Area Inset 동적 제거 시도',
    },
    hypothesis: {
      en: 'Detecting keyboard open via visualViewport height contraction and reducing safe-area padding from 34px to 0px will snap input to keyboard.',
      ko: '키보드 오픈 시점(뷰포트 높이 축소 감지)에 Safe Area 하단 패딩(34px)을 0px로 줄이면 키보드에 밀착될 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Header pushed off-screen as Safari pans window up', ko: '사파리가 외부 창을 밀어올려 상단 헤더가 화면 위로 사라짐' } },
      { id: '1-2', status: 'fail', comment: { en: 'Dual-scroll occurs when scrolling on input area', ko: '인풋 영역 스크롤 시 이중 스크롤 발생' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset padding remains despite dynamic padding change attempt', ko: '동적 패딩 변경 시도에도 fixed 렌더링 특성상 34px 공백이 유지됨' } },
      { id: '1-4', status: 'pass', comment: { en: 'Safari pans window up, naturally keeping body bottom above input', ko: '사파리가 창을 올려 바디 하단 위치가 인풋 위에 자연 보존됨' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'In pure position: fixed layout, collapsing safe-area padding dynamically upon viewport contraction fails to eliminate the 34px gap above keyboard because bottom: 0 remains pinned to the layout viewport behind the keyboard.',
      ko: '순수 position: fixed 구조에서는 뷰포트 축소 감지 후 하단 패딩을 줄여도 position: fixed의 기준점이 키보드 뒤 레이아웃 뷰포트 바닥에 머물러 키보드 위 34px 공백이 제거되지 않음.',
    },
    nextDecision: {
      en: 'Branch into EXP-01-C to test locking window scroll at (0,0) on focus to pin the top header.',
      ko: 'fixed 상태에서 헤더 위치를 고정하기 위해 포커스 시점에 화면 스크롤을 강제로 (0,0)에 고정하는 EXP-01-C로 연계.',
    },
  },
  {
    id: 'exp01_c',
    status: 'failed',
    title: {
      en: 'EXP-01-C: Document Scroll Lock',
      ko: 'EXP-01-C: 포커스 시 상단 스크롤 강제 고정',
    },
    hypothesis: {
      en: 'Forcing window scroll to (0,0) on input focus will keep the top header firmly pinned at the top of the screen.',
      ko: '인풋 포커스 시 화면 스크롤을 (0,0)으로 강제 고정하면 상단 헤더 위치를 유지할 수 있을 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header stays at (0,0) top position', ko: '상단 헤더 고정 성공' } },
      { id: '1-2', status: 'fail', comment: { en: 'Input drops to bottom and is completely covered by keyboard', ko: '화면 스크롤이 (0,0)으로 고정되면서 인풋이 키보드 뒤에 가려져 보이지 않음' } },
      { id: '1-3', status: 'fail', comment: { en: 'Input invisible behind keyboard', ko: '인풋 가림으로 인해 인셋 여백 무의미' } },
      { id: '1-4', status: 'fail', comment: { en: 'Scroll resets to 0, losing body bottom anchor', ko: '스크롤이 강제 초기화되어 바디 하단 앵커링 소실' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Locking window scroll to (0,0) preserves the top header but completely buries the fixed input behind the keyboard because container height is not contracted to the visible viewport.',
      ko: '화면 스크롤을 (0,0)에 묶으면 상단 헤더는 유지되지만, 컨테이너 높이가 가시 뷰포트로 축소되지 않아 position: fixed 인풋이 키보드 뒤에 완전히 가려지는 원천적 한계 확인.',
    },
    nextDecision: {
      en: 'Abandon position: fixed and test modern CSS 100dvh In-Flow Flexbox layout in EXP-01-D.',
      ko: 'position: fixed 방식을 배제하고, CSS 100dvh 단위를 사용하는 In-Flow Flexbox 레이아웃(EXP-01-D)으로 전환.',
    },
  },
  {
    id: 'exp01_d',
    status: 'failed',
    title: {
      en: 'EXP-01-D: Pure CSS 100dvh In-Flow',
      ko: 'EXP-01-D: 순수 CSS 100dvh In-Flow 레이아웃',
    },
    hypothesis: {
      en: 'CSS 100dvh unit with In-Flow Flexbox will auto-shrink container on keyboard open without JavaScript.',
      ko: 'CSS 100dvh 단위와 In-Flow Flexbox를 적용하면 자바스크립트 없이도 브라우저가 키보드 크기에 맞춰 레이아웃을 스스로 축소할 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: '100dvh ignores virtual keyboard, causing window to pan', ko: '100dvh가 가상 키보드에 반응하지 않아 화면 전체가 밀려 올라감' } },
      { id: '1-2', status: 'fail', comment: { en: 'Dual-scroll occurs when scrolling on input area', ko: '인풋 영역 스크롤 시 이중 스크롤 발생' } },
      { id: '1-3', status: 'fail', comment: { en: 'Layout clipping on drag', ko: '키보드 활성화 시 레이아웃 하단 잘림' } },
      { id: '1-4', status: 'pass', comment: { en: 'Body bottom preserved via window shift', ko: '창 이동으로 인해 바디 하단 위치가 자연 보존됨' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'iOS WebKit specification explicitly defines 100dvh relative to browser URL bar collapse/expand only, ignoring the virtual keyboard entirely. Pure CSS approach is officially exhausted.',
      ko: 'iOS 사파리 WebKit 명세상 100dvh는 주소창 변화에만 반응하고 가상 키보드는 완전히 무시하도록 정의되어 있어, 순수 CSS만으로는 키보드 뷰포트 대응이 원천 불가능함을 확인.',
    },
    nextDecision: {
      en: 'Conclude Phase 1 (Pure CSS). Transition to Phase 2 by binding window.visualViewport height directly to Flex container in EXP-02-A.',
      ko: '순수 CSS 방식(Phase 1)을 종료하고, Visual Viewport API를 컨테이너 높이에 직접 연동하는 Phase 2 (EXP-02-A)로 전환.',
    },
  },

  /* ==========================================================================
     PHASE 2: JS Viewport Engine & Flaw Eradication (JS 뷰포트 엔진 도입과 물리 결함 격파)
     ========================================================================== */
  {
    id: 'exp02_a',
    status: 'failed',
    title: {
      en: 'EXP-02-A: Dynamic visualViewport Binding',
      ko: 'EXP-02-A: visualViewport.height 1:1 동기화',
    },
    hypothesis: {
      en: 'Injecting measured visualViewport.height directly into Flex container height will fit layout cleanly to visible screen.',
      ko: '실시간 측정하는 visualViewport.height를 Flex 컨테이너 높이로 1:1 주입하면 키보드 위 가시 영역에 레이아웃이 맞추어질 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Without top scroll lock, Safari pans window up and pushes header off-screen', ko: '상단 스크롤 락이 없어 사파리가 외부 창을 밀어올려 헤더가 위로 이탈' } },
      { id: '1-2', status: 'pass', comment: { en: 'Single unified In-Flow scroll verified', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'fail', comment: { en: 'Safari window push exposes 336px empty space (keyboard height) below input', ko: '사파리 창 밀림으로 인해 인풋 아래에 키보드 높이(약 336px) 빈 공간 노출' } },
      { id: '1-4', status: 'fail', comment: { en: 'Reading anchor displaced by 336px', ko: '336px 오차로 바디 하단 앵커링 소실' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'In-Flow Flex structure is established, but without top scroll lock, Safari pans window up upon focus, pushing header off-screen and exposing 336px empty space (iOS keyboard height) below input.',
      ko: 'In-Flow Flex 3단 정렬 구조의 기반을 확보했으나, 상단 스크롤 락이 없어 포커스 시 사파리가 외부 창을 밀어올려 상단 헤더가 이탈하고 인풋 아래에 키보드 높이만큼(약 336px) 빈 공간이 노출됨.',
    },
    nextDecision: {
      en: 'Test top: 0 anchor lock (EXP-02-B) vs transform offset tracking (EXP-02-C) to eliminate the 336px bottom gap.',
      ko: '상단 고정 및 스크롤 락(02-B)과 오프셋 실시간 추적(02-C)을 비교 검증하여 하단 빈 공간 제거 착수.',
    },
  },
  {
    id: 'exp02_b',
    status: 'progress',
    title: {
      en: 'EXP-02-B: Top Anchor & Focus Scroll Lock',
      ko: 'EXP-02-B: 상단 top: 0 고정 & 포커스 스크롤 락',
    },
    hypothesis: {
      en: 'Pinning container top: 0 and locking window scroll to (0,0) will conceal the 336px gap under the keyboard.',
      ko: '컨테이너를 top: 0에 고정하고 외부 화면 스크롤을 즉시 (0,0)으로 잠그면 하단 336px 빈 공간이 키보드 아래로 가려질 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header firmly pinned to top (window scroll locked at 0)', ko: '상단 헤더 고정 성공 (스크롤 위치 0 유지)' } },
      { id: '1-2', status: 'pass', comment: { en: 'Single unified scroll maintained cleanly', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset gap remains above keyboard', ko: '키보드 활성화 시 34px Safe Area Inset 공백 잔존' } },
      { id: '1-4', status: 'fail', comment: { en: 'Reading line jumps on height contraction', ko: '컨테이너 높이 축소 시 바디 하단 앵커링 위치 이동' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Top anchor and scroll lock successfully pins header and conceals the 336px bottom gap. However, 34px Safe Area Inset gap remains above keyboard, and dragging input shell triggers browser outer scroll gestures.',
      ko: 'top: 0 고정 및 상단 스크롤 락으로 헤더 고정 및 하단 336px 빈 공간 은폐에 성공함. 그러나 키보드 위에 34px Safe Area Inset 공백이 그대로 남고, 인풋 바를 드래그할 때 브라우저 바깥 스크롤 제스처가 유발됨.',
    },
    nextDecision: {
      en: 'Apply touch-action: none on input shell in EXP-02-D to eliminate the touch jitter.',
      ko: '인풋 바에 touch-action: none을 적용하여 터치 시 덜컹거림을 제거하는 EXP-02-D로 연계.',
    },
  },
  {
    id: 'exp02_c',
    status: 'failed',
    title: {
      en: 'EXP-02-C: Transform translateY Offset Tracking',
      ko: 'EXP-02-C: translateY(offsetTop) 실시간 추적',
    },
    hypothesis: {
      en: 'Tracking visualViewport offsetTop and applying transform: translateY without locking scroll will keep container aligned with visible area.',
      ko: '스크롤을 잠그지 않고 뷰포트 오프셋(offsetTop)을 측정하여 translateY로 컨테이너를 가시 영역에 1:1 추적시킨다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Stuttering follow lag: Container jitters and chases offset when rubbing input bar', ko: '인풋 바를 문지를 때 화면이 덜컹거리며 뒤늦게 따라오는 60Hz 추격 래그 발생' } },
      { id: '1-2', status: 'fail', comment: { en: 'Massive empty gap exposed below input as container lags behind', ko: '인풋 아래 거대한 빈 공간이 노출되고 그 뒤를 화면이 따라가는 이중 스크롤 결함' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset gap remains above keyboard', ko: '키보드 활성화 시 34px Safe Area Inset 공백 잔존' } },
      { id: '1-4', status: 'fail', comment: { en: 'Body bottom scroll anchoring jitters during movement', ko: '바디 하단 앵커링이 덜컹거리며 흔들림' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Chasing offset post-event exposes a massive bottom gap, causes 60Hz stuttering follow lag on dragging due to compositor frame delay, and makes container slide up from bottom on dismiss.',
      ko: '인풋 바를 문지르면 인풋 아래 거대한 빈 공간이 드러난 채 화면이 60Hz 프레임 지연으로 드르륵거리며 쫓아가고, 포커스 해제 시 밑에서부터 화면이 솟아오르는 등 사후 오프셋 추적 방식의 물리적 한계 확인.',
    },
    nextDecision: {
      en: 'Permanently abandon post-event offset tracking and commit to pre-emptive top: 0 anchor lock (02-B / 02-D).',
      ko: '오프셋 추적 방식을 배제하고, 컨테이너를 상단에 미리 묶어두는 사전 차단 방식(02-B / 02-D)을 최종 방향으로 확정.',
    },
  },
  {
    id: 'exp02_d',
    status: 'progress',
    title: {
      en: 'EXP-02-D: Zero-Jank Input Shell Touch Lock',
      ko: 'EXP-02-D: 인풋 쉘 touch-action: none 완전 고정',
    },
    hypothesis: {
      en: 'Adding touch-action: none on input shell and intercepting outer touchmove will block the browser from initiating outer scroll gestures.',
      ko: '인풋 바 영역에 touch-action: none을 적용하고 본문 외 touchmove를 차단하면 인풋 바를 문질러도 브라우저가 바깥 스크롤을 시작하지 못할 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header firmly pinned to top (window scroll locked at 0)', ko: '상단 헤더 고정 성공 (스크롤 위치 0 유지)' } },
      { id: '1-2', status: 'pass', comment: { en: '0-pixel motionless lock achieved when dragging input shell', ko: '인풋 바 드래그 시에도 흔들림 없는 0픽셀 고정 및 단일 스크롤 유지' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset gap remains above keyboard', ko: '키보드 활성화 시 34px Safe Area Inset 공백 잔존' } },
      { id: '1-4', status: 'fail', comment: { en: 'Reading line shifts on container resize', ko: '컨테이너 높이 축소 시 바디 하단 앵커링 위치 이동' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Input shell remains 100% motionless even during aggressive dragging, completing the core viewport lock architecture. However, 34px Safe Area Inset and scroll position loss on resize remain unsolved.',
      ko: '인풋 바를 문질러도 흔들림 없이 안정적으로 고정되는 뷰포트 락 구조 확보. 단, 키보드 위 34px Safe Area Inset 공백과 높이 축소 시 바디 스크롤 앵커링 문제는 여전히 미해결.',
    },
    nextDecision: {
      en: 'Conclude Phase 2. Move to Phase 3 (EXP-03-A) to eliminate the 34px Safe Area Inset gap and implement body scroll anchoring.',
      ko: 'Phase 2(뷰포트 락 기반)를 완료하고, 34px 인셋 공백 제거 및 바디 스크롤 앵커링을 구현하는 Phase 3 (EXP-03-A)로 진입.',
    },
  },

  /* ==========================================================================
     PHASE 3: Native Parity & Coordinate Precision (네이티브 동등성 & 정밀 좌표 완성)
     ========================================================================== */
  {
    id: 'exp03_a',
    status: 'progress',
    title: {
      en: 'EXP-03-A: Zero-Gap Inset & Compact Snap',
      ko: 'EXP-03-A: Safe Area Inset 0px 축소 & 8px 초밀착',
    },
    hypothesis: {
      en: 'Collapsing safe-area padding (34px -> 0px) on keyboard open and applying 8px padding will snap the input bar tightly above the keyboard.',
      ko: '키보드 활성화 시점에 Safe Area Inset(34px)을 0px로 축소하고 8px 마진을 적용하면 키보드 윗선에 네이티브 메시지 앱처럼 초밀착될 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header firmly pinned to top', ko: '상단 헤더 고정 성공' } },
      { id: '1-2', status: 'pass', comment: { en: 'Input perfectly visible with unified scroll', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: '34px Safe Area Inset eliminated; snaps with 8px compact margin', ko: '34px Safe Area Inset 제거 및 8px 초밀착 성공' } },
      { id: '1-4', status: 'fail', comment: { en: 'Body shrinks by contraction amount (~300px+), burying bottom reading position behind keyboard', ko: '플렉스박스 본문 높이 축소량만큼 하단 읽기 위치가 키보드 뒤로 가려지는 앵커링 붕괴' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Collapsing Safe Area Inset (34px -> 0px) achieves 8px compact snap matching native iOS Messages. However, with top fixed, body height contraction (ΔH) swallows the bottom reading area behind the keyboard due to lack of scroll offset compensation.',
      ko: 'Safe Area Inset(34px ➔ 0px)을 제거하여 키보드 위 8px 초밀착에 성공함. 그러나 상단 헤더가 고정된 상태에서 컨테이너 높이가 수축량(ΔH)만큼 줄어들며, 바디 스크롤 위치 보정이 없어 본문 하단 읽기 영역이 키보드 뒤로 파묻히는 앵커링 붕괴 현상 확인.',
    },
    nextDecision: {
      en: 'Measure body height contraction via ResizeObserver and compensate scroll offset in real-time in EXP-03-B.',
      ko: '본문 높이 수축량을 ResizeObserver로 측정하여 본문 스크롤 위치를 실시간으로 보정하는 EXP-03-B로 연계.',
    },
  },
  {
    id: 'exp03_b',
    status: 'progress',
    title: {
      en: 'EXP-03-B: Body ResizeObserver Scroll Anchoring',
      ko: 'EXP-03-B: ResizeObserver 바디 하단 스크롤 앵커링',
    },
    hypothesis: {
      en: 'Freezing baseline scroll position and compensating scroll offset by exact body height contraction (closedScrollTop + ΔH) will keep bottom reading line anchored with 0.0px drift.',
      ko: '닫힘 상태의 기준 스크롤 위치와 높이를 기억하고, 본문이 줄어든 실제 수축량(ΔH)만큼 스크롤 위치를 실시간 보정(closedScrollTop + ΔH)하면 바디 하단 읽기 라인이 0.0px 오차로 유지될 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header firmly pinned to top', ko: '상단 헤더 고정 성공' } },
      { id: '1-2', status: 'pass', comment: { en: 'Unified single scroll verified', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: '8px bottom snap preserved', ko: '8px 초밀착 상태 유지' } },
      { id: '1-4', status: 'pass', comment: { en: 'PWA: 0.0px anchor works. Safari: Intermittently maintained, but un-anchored on repeated trials due to 350ms resize throttle', ko: 'PWA: 0.0px 앵커링 성공. 사파리: 사파리의 350ms 리사이즈 지연 알림으로 인해 여러 번 시도 시 앵커링 풀림 관찰' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'PWA achieves clean 0.0px anchoring via closedScrollTop + ΔH formula. However, in Safari browser mode, throttled viewport resize events (350ms delay) cause the anchor to unbind late or fail on repeated attempts. Inline body inputs also collide with floating bar.',
      ko: 'closedScrollTop + ΔH 공식을 통해 PWA에서는 0.0px 앵커링이 매끄럽게 작동함. 그러나 사파리 일반 탭에서는 뷰포트 리사이즈 지연(0.35초)으로 인해 앵커링이 늦게 풀리거나 어긋나는 현상 관찰. 또한 본문 폼 입력 시 플로팅 인풋 충돌 결함 확인.',
    },
    nextDecision: {
      en: 'Implement body form input focus handover and floating suppression (0px collapse) in EXP-03-C.',
      ko: '본문 폼 인풋 터치 시 하단 플로팅 바를 0px로 접어 숨기는 Focus Handover를 구현하는 EXP-03-C로 연계.',
    },
  },
  {
    id: 'exp03_c',
    status: 'progress',
    title: {
      en: 'EXP-03-C: Inline Focus Handover & Floating Suppression',
      ko: 'EXP-03-C: 본문 인풋 포커스 핸드오버 & 0px 숨김',
    },
    hypothesis: {
      en: 'Suppressing floating input to 0px when body inline form input is focused will secure body input space, restoring it on blur.',
      ko: '본문 폼 인풋에 포커스되면 플로팅 바를 0px로 접어 본문 입력 공간을 확보하고, 포커스 해제 시 복원한다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header firmly pinned to top', ko: '상단 헤더 고정 성공' } },
      { id: '1-2', status: 'pass', comment: { en: 'Unified single scroll verified', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: '8px snap preserved', ko: '8px 초밀착 상태 유지' } },
      { id: '1-4', status: 'pass', comment: { en: 'Anchoring latency persists in Safari browser mode', ko: '사파리 일반 탭에서 앵커링 지연/어긋남 잔존' } },
      { id: '2-1', status: 'pass', comment: { en: 'Floating bar collapses to 0px when typing in body form', ko: '본문 폼 입력 시 플로팅 인풋 0px 자동 숨김 성공' } },
      { id: '3-1', status: 'fail', comment: { en: 'Momentary flicker on keyboard dismiss after body input blur in Safari', ko: '사파리 환경에서 본문 포커스 해제 후 키보드가 닫힐 때 순간적인 깜빡임(Flicker) 발생' } },
    ],
    keyFinding: {
      en: 'Body form input suppression succeeds in securing viewport space. However, header is still trapped inside resizing container causing header bounce, and lack of 3-state management creates dismiss flicker in Safari.',
      ko: '본문 폼 입력 시 플로팅 바 0px 숨김에 성공하여 입력 공간을 확보함. 그러나 상단 헤더가 높이가 축소되는 컨테이너 안에 여전히 갇혀 있어 키보드 호출 시 헤더가 덜컹거리고, 3상태 분기 부재로 닫힘 시 깜빡임 발생 확인.',
    },
    nextDecision: {
      en: 'Isolate header physically outside the resizing container and introduce a 3-state input FSM in EXP-03-D.',
      ko: '상단 헤더를 높이가 줄어드는 본문 컨테이너 밖으로 완전히 물리적으로 분리하고, 3가지 입력 상태(FSM)를 명확히 관리하는 EXP-03-D로 연계.',
    },
  },
  {
    id: 'exp03_d',
    status: 'progress',
    title: {
      en: 'EXP-03-D: Isolated Fixed Header & 3-State FSM',
      ko: 'EXP-03-D: 상단 헤더 물리적 격리 & 3-상태 FSM',
    },
    hypothesis: {
      en: 'Decoupling header physically outside resizing container + tracking 3 distinct input states (Closed / Floating / Body) will eliminate header bounce and layout flicker.',
      ko: '상단 헤더를 높이가 줄어드는 본문 컨테이너 밖으로 완전히 물리적으로 분리하여 최상단에 고정하고, 입력 상태를 [닫힘 / 플로팅 활성 / 본문 활성] 3단계로 명확히 관리(FSM)하면 헤더 흔들림과 깜빡임을 모두 잡을 수 있다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header physically isolated; motionless top-lock achieved', ko: '헤더 물리 격리 및 350ms rAF 락으로 상단 헤더 고정 달성' } },
      { id: '1-2', status: 'pass', comment: { en: 'Single unified scroll with 100% feed reachability', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: 'Safe Area removed on open; snaps with compact margin', ko: 'Safe Area Inset 제거 및 8px 초밀착 성공' } },
      { id: '1-4', status: 'pass', comment: { en: 'PWA: Flawless. Safari: Anchoring lags until viewport resize fires', ko: 'PWA: 완벽 작동. 사파리: 뷰포트 리사이즈 전까지 앵커링 해제 지연' } },
      { id: '2-1', status: 'pass', comment: { en: 'Floating bar suppresses to 0px seamlessly during body form input', ko: '본문 폼 입력 시 플로팅 인풋 0px 자동 숨김 작동' } },
      { id: '3-1', status: 'fail', comment: { en: 'Safari: Floating input appears mid-screen (508px height on iPhone) before dropping to bottom on blur', ko: '사파리: 본문 포커스 아웃 시 플로팅 인풋이 화면 중간(iPhone 844px 화면 기준 키보드 제외 508px 지점)에 먼저 튀어나온 뒤 바닥으로 떨어지는 2단계 시차 잔존' } },
    ],
    keyFinding: {
      en: 'Physical header isolation achieves 100% motionless header lock and runs flawlessly in PWA. However, in Safari browser mode, Safari throttles viewport resize events for 350ms on keyboard dismiss, causing the floating bar to pop up mid-screen (at 508px height) before dropping to bottom, along with late scroll un-anchoring.',
      ko: '상단 헤더를 물리적으로 분리하여 어떤 상황에서도 헤더가 1픽셀도 흔들리지 않는 고정을 달성했고 PWA에서는 완벽히 동작합니다. 그러나 일반 사파리 탭에서는 사파리가 키보드가 내려가는 0.35초 동안 화면 크기 변경 알림(visualViewport.resize)을 브라우저 툴바 보호를 위해 일부러 지연시킵니다. 이 때문에 키보드가 닫힐 때 플로팅 바가 화면 정중앙(508px 높이)에 먼저 툭 튀어나왔다가 0.35초 뒤 바닥으로 떨어지는 어색한 2단계 시차와 스크롤 늦은 복원이 관찰되었습니다.',
    },
    nextDecision: {
      en: 'Abandon passive viewport waiting (waiting for 350ms resize event) and implement Focus-Driven Synchronous Teardown in EXP-03-E to restore full-screen height, scroll position, and bottom bar instantaneously at 0ms upon touch.',
      ko: '사파리의 뒤늦은 알림(0.35초)을 수동적으로 기다리지 않고, 사용자가 입력창 바깥을 터치하여 포커스가 풀리는 0ms 즉시 [화면 전체 100dvh 복원 + 스크롤 원복 + 플로팅 바닥 안착]을 단일 틱에 동기적(Synchronous)으로 일괄 실행하는 Focus-Driven 엔진(EXP-03-E)으로 연계합니다.',
    },
  },
  {
    id: 'exp03_e',
    status: 'progress',
    title: {
      en: 'EXP-03-E: Synchronous Viewport Teardown & Dismiss Sync',
      ko: 'EXP-03-E: 동기적 뷰포트 원복 & 닫힘 시차 제어',
    },
    hypothesis: {
      en: 'Synchronously restoring full-screen height, scroll position, and floating input bottom placement at 0ms upon blur will eliminate the mid-screen pop and dismiss latency entirely.',
      ko: '사파리 브라우저의 0.35초 지연 알림을 기다리지 않고, 사용자가 포커스를 해제하는 즉각(0ms) 화면 전체 복원과 스크롤 원복, 플로팅 바닥 안착을 단일 틱에 동기적(Synchronous)으로 일괄 실행하면, 화면 중간 뜸과 시차 없이 바닥에 즉시 매끄럽게 안착될 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header physically isolated; motionless top-lock achieved', ko: '헤더 물리 격리 및 350ms rAF 락으로 상단 헤더 고정 달성' } },
      { id: '1-2', status: 'pass', comment: { en: 'Single unified scroll with 100% feed reachability', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: 'Safe Area removed on open; snaps with compact margin', ko: 'Safe Area Inset 제거 및 8px 초밀착 성공' } },
      { id: '1-4', status: 'pass', comment: { en: 'Zero drift: Flawless instant scroll anchor restoration across PWA & Safari', ko: '0.0px 오차: PWA 및 사파리 전 환경에서 지연 없는 즉각 스크롤 복원 달성' } },
      { id: '2-1', status: 'fail', comment: { en: '1-step suppression (display: none) causes sudden 60px reflow & missing 16px boundary margin causes keyboard bounce', ko: '1단계 즉시 증발(display:none)에 의한 순간 60px 높이 리플로우 및 16px 경계 여백 부재로 키보드가 솟아오르다 즉시 닫힘' } },
      { id: '3-1', status: 'pass', comment: { en: 'Zero mid-screen pop; floating bar seats cleanly at bottom on dismiss', ko: '중간 뜸 현상 완전 제거 및 닫힘 시 바닥 즉시 안착 완료' } },
    ],
    keyFinding: {
      en: 'Synchronous viewport restoration eliminates mid-screen pop and dismiss latency. However, when tapping an inline text input, the 1-step immediate suppression (display: none) causes a sudden 60px layout reflow under the touching finger while Safari calculates focus rects. Combined with missing boundary safe padding (16px alignPadding), Safari WebKit loses touch hit-testing, causing the keyboard to bounce and dismiss immediately. Traditional direct suppression techniques hit an impassable wall here (almost gave up on the project).',
      ko: '동기적 복원으로 화면 중간 뜸과 닫힘 시차는 해결함. 그러나 본문 폼 인풋을 터치할 때 플로팅 바가 1단계 즉각 증발(display: none)하면서 손가락 아래에서 순간적인 60px 높이 리플로우가 발생하고, 16px 안전 여백(Boundary Margin) 부재로 인해 사파리 WebKit의 터치 히트 테스팅 및 뷰포트 정렬 휴리스틱이 깨져 키보드가 올라오다 도로 닫혀버리는(Bounce & Dismiss) 결함 발생. 단순한 DOM 강제 은닉이나 억제 방식으로는 해결할 수 없어 거의 포기할 뻔했던 최대의 난관 지점.',
    },
    nextDecision: {
      en: 'Develop 2-step suppression (visibility: hidden -> display: none upon keyboard open) and In-Viewport Boundary Evasion in EXP-03-F (FINAL WINNER): Preserve 60px slot geometry during touch while proactively aligning focused body inputs into the safe visible zone ([topLimit, bottomLimit] with 16px padding).',
      ko: '터치 순간에는 60px 레이아웃 높이를 그대로 보존하는 2단계 서프레션(visibility: hidden ➔ 키보드 완전히 열린 후 display: none)과, 포커스된 인풋을 안전 가시 영역(16px 패딩) 안쪽으로 부드럽게 사전 정렬하는 경계 회피 전략(EXP-03-F, 최종 완성형)으로 연계.',
    },
  },
  {
    id: 'exp03_f',
    status: 'winner',
    title: {
      en: 'EXP-03-F: In-Viewport Boundary Evasion (FINAL WINNER)',
      ko: 'EXP-03-F: 뷰포트 경계 회피를 통한 사파리 개입 무력화 (최종 완성형)',
    },
    hypothesis: {
      en: 'Proactively aligning focused body elements within [topLimit, bottomLimit] with 16px safe padding and 2-step suppression will eliminate the trigger condition for Safari aggressive compositor scroll, achieving 100% stable keyboard presentation on bottom inputs.',
      ko: '포커스된 본문 인풋이 화면 경계(상단 헤더 아래, 하단 키보드 위)에 걸치지 않도록 안전 여백(16px)으로 부드럽게 사전 정렬하고 2단계 서프레션(60px 슬롯 보존)을 적용하면, 사파리의 강제 스크롤 개입 조건과 터치 미스를 원천 차단하여 최하단 인풋에서도 키보드 튕김 없이 완벽히 동작할 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header motionless and locked at top (0.0px)', ko: '상단 헤더 0.0px 완전 고정 달성' } },
      { id: '1-2', status: 'pass', comment: { en: 'Single unified scroll with 100% feed reachability', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: 'Safe Area removed on open; snaps with 8px compact margin', ko: 'Safe Area Inset 제거 및 8px 초밀착 성공' } },
      { id: '1-4', status: 'pass', comment: { en: 'Scroll anchor preserved during safe boundary alignment', ko: '안전 경계 정렬 중에도 스크롤 앵커링 완벽 보존' } },
      { id: '2-1', status: 'pass', comment: { en: 'Bottom body input stays fully stable without keyboard bounce (16px safe margin)', ko: '16px 안전 마진 정렬로 최하단 본문 인풋 포커스 시 키보드 튕김/내려감 현상 완전 차단' } },
      { id: '3-1', status: 'pass', comment: { en: 'Zero mid-screen pop; clean dismiss restoration', ko: '중간 뜸 현상 완전 제거 및 닫힘 시 바닥 즉시 안착 완료' } },
    ],
    keyFinding: {
      en: '100% Native App Parity Achieved! Preemptive 16px boundary evasion and 60px slot geometry preservation completely disarm Safari native layout push without fighting browser compositor threads. Combined with declarative FSM and zero-shift scroll restoration, all 6 evaluation criteria pass across iOS Safari and PWA.',
      ko: '네이티브 앱 수준의 최종 완성 달성! 브라우저와 억지로 싸우는 대신 사파리의 개입 조건 자체를 사전에 소멸시키는 16px 경계 회피(Boundary Evasion)와 터치 지오메트리를 보존하는 2단계 서프레션(60px 슬롯 보존)으로 키보드 튕김까지 완벽 정복. 상단 헤더 0.0px 고정, 단일 통합 스크롤, 기준 좌표 무손실 복원까지 6개 평가 항목 100% All Pass 달성.',
    },
    nextDecision: {
      en: 'Adopted as the core production engine of react-mobile-keyboard-layout library.',
      ko: 'react-mobile-keyboard-layout 라이브러리의 최종 공식 프로덕션 엔진으로 채택 및 배포.',
    },
  },
]
