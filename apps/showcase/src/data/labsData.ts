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
      ko: '표준 CSS position: fixed와 Safe Area Inset만으로 iOS 사파리에서 인풋이 바닥에 안정적으로 유지되는지 검증한다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Header pushed off-screen as Safari pans window up', ko: '사파리가 외부 창을 밀어올려 상단 헤더가 화면 위로 사라짐' } },
      { id: '1-2', status: 'fail', comment: { en: 'Dual-scroll occurs when scrolling on input area', ko: '인풋 영역 스크롤 시 이중 스크롤 발생' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset gap remains above keyboard', ko: '키보드 활성화 시 34px Safe Area Inset 공백 잔존' } },
      { id: '1-4', status: 'pass', comment: { en: 'Safari pans window up, naturally keeping body bottom above input', ko: '사파리가 창을 올려 바디 하단 위치가 인풋 위에 자연 보존됨' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'position: fixed structure causes top header loss, dual-scroll collision on input dragging, and leaves an unnecessary 34px Safe Area Inset gap above the keyboard.',
      ko: 'position: fixed 구조에서는 사파리의 뷰포트 이동으로 인해 상단 헤더가 화면 밖으로 밀려나고, 인풋 터치 시 이중 스크롤이 발생하며, 키보드 위에 34px Safe Area Inset 공백이 그대로 남음.',
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
      en: 'In pure position: fixed layout, collapsing safe-area padding dynamically upon viewport contraction fails to eliminate the 34px gap above keyboard.',
      ko: '순수 position: fixed 구조에서는 뷰포트 축소 감지 후 하단 패딩을 줄여도 브라우저 렌더링 특성상 키보드 위 34px 공백이 제거되지 않음.',
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
      en: 'Locking window scroll to (0,0) preserves the top header but completely buries the fixed input behind the keyboard.',
      ko: '화면 스크롤을 (0,0)에 묶으면 상단 헤더는 유지되지만, position: fixed 인풋이 키보드 뒤에 완전히 가려지는 원천적 한계 확인.',
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
      en: 'iOS WebKit specification explicitly restricts 100dvh to browser URL bar changes, completely ignoring virtual keyboard. Pure CSS approach is officially exhausted.',
      ko: 'iOS 사파리 WebKit 명세상 100dvh는 주소창 변화에만 반응하고 가상 키보드는 무시하므로, 순수 CSS만으로는 뷰포트 대응이 불가능함을 확인.',
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
      { id: '1-1', status: 'fail', comment: { en: 'WebKit focus scroll push creates 336px empty gap', ko: '초기 포커스 시 브라우저 기본 스크롤 동작으로 인해 하단에 336px 빈 공간 노출' } },
      { id: '1-2', status: 'pass', comment: { en: 'Single unified In-Flow scroll verified', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'fail', comment: { en: '336px empty space remains before manual scroll', ko: '수동 스크롤 전까지 336px 빈 공간 잔존' } },
      { id: '1-4', status: 'fail', comment: { en: 'Reading anchor displaced by 336px', ko: '336px 오차로 바디 하단 앵커링 소실' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'In-Flow Flex 3-section structure is effective, but WebKit focus scroll pushes container up, exposing a 336px gap below input.',
      ko: 'In-Flow Flex 3단 정렬 구조의 기반을 확보했으나, 초기 포커스 시 사파리가 외부 창을 밀어올리며 인풋 아래에 키보드 높이만큼(약 336px) 빈 공간이 노출됨.',
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
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset gap remains', ko: '키보드 활성화 시 34px Safe Area Inset 공백 잔존' } },
      { id: '1-4', status: 'fail', comment: { en: 'Reading line jumps on height contraction', ko: '컨테이너 높이 축소 시 바디 하단 앵커링 위치 이동' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Pinning container to top and locking window scroll successfully conceals the gap, with only minor 1-frame jitter remaining when dragging input bar.',
      ko: '컨테이너를 상단에 고정하고 스크롤을 차단하는 구조가 유효함을 확인. 단, 인풋 바를 터치하여 문지를 때 1프레임 미세 덜컹거림 발생.',
    },
    nextDecision: {
      en: 'Apply touch-action: none on input shell in EXP-02-D to eliminate the 1-frame jitter.',
      ko: '인풋 바에 touch-action: none을 적용하여 터치 덜컹거림을 제거하는 EXP-02-D로 연계.',
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
      { id: '1-1', status: 'fail', comment: { en: 'Stuttering follow lag: Container jitters and chases offset when rubbing input bar', ko: '인풋 바를 문지를 때 화면이 덜컹거리며 뒤늦게 따라오는 추격 래그 발생' } },
      { id: '1-2', status: 'fail', comment: { en: 'Massive empty gap exposed below input as container lags behind', ko: '인풋 아래 거대한 빈 공간이 노출되고 그 뒤를 화면이 따라가는 이중 스크롤 결함' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset gap remains above keyboard', ko: '키보드 활성화 시 34px Safe Area Inset 공백 잔존' } },
      { id: '1-4', status: 'fail', comment: { en: 'Body bottom scroll anchoring jitters during movement', ko: '바디 하단 앵커링이 덜컹거리며 흔들림' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Chasing offset post-event exposes a massive bottom gap, causes stuttering follow lag on dragging, and makes container slide up from bottom on dismiss.',
      ko: '인풋 바를 문지르면 인풋 아래 거대한 빈 공간이 드러난 채 화면이 드르륵거리며 쫓아가고, 포커스 해제 시 밑에서부터 화면이 솟아오르는 등 사후 오프셋 추적 방식의 물리적 한계 확인.',
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
      en: 'Adding touch-action: none on input shell will block the browser from initiating outer scroll gestures.',
      ko: '인풋 바 영역에 touch-action: none을 적용하면 인풋 바를 문질러도 브라우저가 바깥 스크롤을 시작하지 못할 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header firmly pinned to top (window scroll locked at 0)', ko: '상단 헤더 고정 성공 (스크롤 위치 0 유지)' } },
      { id: '1-2', status: 'pass', comment: { en: '0-pixel motionless lock achieved when dragging input shell', ko: '인풋 바 드래그 시에도 흔들림 없는 0픽셀 고정 및 단일 스크롤 유지' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset gap remains', ko: '키보드 활성화 시 34px Safe Area Inset 공백 잔존' } },
      { id: '1-4', status: 'fail', comment: { en: 'Reading line shifts on container resize', ko: '컨테이너 높이 축소 시 바디 하단 앵커링 위치 이동' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Input shell remains 100% motionless even during aggressive dragging, completing the core viewport lock architecture.',
      ko: '인풋 바를 문질러도 1프레임의 흔들림 없이 안정적으로 고정되는 뷰포트 락 구조 확보.',
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
      en: 'Collapsing safe-area padding to 0px on keyboard open will snap the input bar with compact 8px margin.',
      ko: '키보드 활성화 시점에 Safe Area Inset(34px)을 0px로 축소하면 키보드 윗선에 8px 마진으로 밀착될 것이다.',
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
      en: 'Collapsing Safe Area Inset to 0px achieves 8px compact snap. However, with Flexbox top fixed, body height contraction swallows the bottom reading area behind the keyboard.',
      ko: 'Safe Area Inset을 0px로 축소하여 키보드 위 8px 밀착에 성공함. 그러나 플렉스박스 상단이 고정된 상태에서 컨테이너 높이가 줄어들며, 본문 하단 읽기 영역이 수축된 높이만큼 키보드 뒤로 가려지는 현상 확인.',
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
      en: 'Freezing baseline scroll position and compensating scroll offset by exact body height contraction will keep bottom reading line anchored with 0.0px drift.',
      ko: '닫힘 상태의 기준 스크롤 위치와 높이를 기억하고, 본문이 줄어든 실제 수축량만큼 스크롤 위치를 보정하면 바디 하단 읽기 라인이 0.0px 오차로 유지될 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header firmly pinned to top', ko: '상단 헤더 고정 성공' } },
      { id: '1-2', status: 'pass', comment: { en: 'Unified single scroll verified', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: '8px bottom snap preserved', ko: '8px 초밀착 상태 유지' } },
      { id: '1-4', status: 'pass', comment: { en: 'Reading line anchored with 0.0px drift and restored cleanly on dismiss', ko: '바디 하단 읽기 위치가 0.0px 오차로 고정되며, 닫힘 시 원래 위치로 복원' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: '0.0px Scroll Anchoring achieved on floating input. However, when tapping inline body form inputs, the bottom floating bar remains active and visible, covering body inputs and causing dual-input conflicts.',
      ko: '플로팅 인풋을 열고 닫을 때 0.0px 바디 하단 스크롤 앵커링이 달성됨. 그러나 본문(인라인) 폼 인풋을 터치하여 키보드를 열었을 때도 하단 플로팅 인풋이 사라지지 않고 활성화되어 본문 입력을 가리고 충돌하는 결함 확인.',
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
      { id: '1-4', status: 'pass', comment: { en: '0.0px reading anchor preserved', ko: '0.0px 바디 하단 스크롤 앵커링 유지' } },
      { id: '2-1', status: 'pass', comment: { en: 'Floating bar collapses to 0px when typing in body form', ko: '본문 폼 입력 시 플로팅 인풋 0px 자동 숨김 성공' } },
      { id: '3-1', status: 'fail', comment: { en: '1-frame flicker on keyboard dismiss after body input blur', ko: '본문 포커스 해제 후 키보드가 닫힐 때 1프레임 깜빡임(Flicker) 발생' } },
    ],
    keyFinding: {
      en: 'Floating bar collapses seamlessly to 0px during body form input. However, 1-frame dismiss flicker remains when keyboard closes after body input blur.',
      ko: '본문 폼 입력 시 플로팅 바 0px 숨김에 성공하여 입력창 충돌을 해결함. 단, 본문 포커스 해제 후 키보드가 닫힐 때 1프레임 깜빡임 잔존 확인.',
    },
    nextDecision: {
      en: 'Physically isolate header outside resizing container and implement 3-state FSM in EXP-03-D.',
      ko: '헤더를 뷰포트 수축 컨테이너 밖으로 완전히 물리적으로 격리하고 3-상태 FSM을 도입하는 EXP-03-D (Winner)로 연계.',
    },
  },
  {
    id: 'exp03_d',
    status: 'winner',
    title: {
      en: 'EXP-03-D: Isolated Fixed Header & Zero-Shift Top Anchor (WINNER ★)',
      ko: 'EXP-03-D: 상단 헤더 물리적 격리 & Zero-Shift 완성형 (WINNER ★)',
    },
    hypothesis: {
      en: 'Decoupling header outside visualViewport container + preventScroll + 350ms rAF lock + 3-state FSM achieves Native App Parity.',
      ko: '헤더를 수축 컨테이너 바깥 최상단에 물리적으로 격리 고정하고, 350ms rAF 락과 3-상태 FSM을 결합하면 완벽한 상단 헤더 고정과 네이티브 앱 수준의 사용성을 달성할 수 있다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header physically isolated; motionless top-lock achieved', ko: '헤더 물리 격리 및 350ms rAF 락으로 상단 헤더 고정 달성' } },
      { id: '1-2', status: 'pass', comment: { en: 'Single unified scroll with 100% feed reachability', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: 'Safe Area removed on open; snaps with compact margin', ko: 'Safe Area Inset 제거 및 8px 초밀착 성공' } },
      { id: '1-4', status: 'pass', comment: { en: 'Reading line anchored with 0.0px visual drift', ko: '기준값 기반 0.0px 바디 하단 스크롤 앵커링 고정' } },
      { id: '2-1', status: 'pass', comment: { en: 'Floating bar suppresses to 0px seamlessly during body form input', ko: '본문 폼 입력 시 플로팅 인풋 0px 자동 숨김 완벽 작동' } },
      { id: '3-1', status: 'pass', comment: { en: '3-state FSM eliminates dismiss flicker 100%', ko: '3-상태 FSM 도입으로 포커스 해제 시 깜빡임 없이 매끄러운 복원 완료' } },
    ],
    keyFinding: {
      en: 'Native App Parity achieved: Header top-lock, single unified scroll, 0.0px Body Bottom Scroll Anchoring, compact snap, and zero flicker across iOS devices.',
      ko: '상단 헤더 고정, 단일 스크롤, 0.0px 바디 하단 스크롤 앵커링, Safe Area Inset 제거, FSM 기반 깜빡임 없는 복원을 모두 만족하며 네이티브 앱 수준의 품질 달성.',
    },
    nextDecision: {
      en: 'Adopted as the core production engine of react-mobile-keyboard-layout library.',
      ko: 'react-mobile-keyboard-layout 라이브러리의 공식 프로덕션 엔진으로 채택 및 배포.',
    },
  },
]
