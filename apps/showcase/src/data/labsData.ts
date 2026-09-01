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
  {
    id: 'exp01',
    status: 'failed',
    title: {
      en: 'EXP-01: Baseline Standard Fixed',
      ko: 'EXP-01: 순수 CSS position: fixed 기준점',
    },
    hypothesis: {
      en: 'Standard CSS position: fixed with safe-area padding can anchor the input at the bottom on iOS Safari.',
      ko: '표준 CSS fixed와 Safe Area Inset만으로 사파리에서 인풋이 바닥에 안정적으로 유지되는지 검증한다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Header pushed off-screen as Safari pans window up', ko: '사파리가 외부 창을 밀어올려 상단 헤더가 화면 위로 밀려 사라짐' } },
      { id: '1-2', status: 'fail', comment: { en: 'Dual-scroll occurs when scrolling on input area', ko: '인풋 영역 스크롤 시 이중 스크롤 발생' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset gap remains above keyboard', ko: '키보드 활성화 시 34px Safe Area Inset 공백 미제거' } },
      { id: '1-4', status: 'pass', comment: { en: 'Safari pans window up, naturally keeping body bottom above input', ko: '사파리가 창을 올려 바디 하단 위치가 인풋 위에 자연 보존됨' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'position: fixed creates dual-scrollport fighting, loses the top header, and leaves an unnecessary 34px Safe Area gap above keyboard.',
      ko: 'position: fixed는 이중 스크롤 충돌, 상단 헤더 실종, 키보드 위 34px Safe Area Inset 공백을 유발함을 실증.',
    },
    nextDecision: {
      en: 'Branch into two investigative paths: (1) Find a way to remove Safe Area gap (EXP-01-A), and (2) Try locking the top header (EXP-01-B).',
      ko: '두 갈래 방향으로 분기: (1) 키보드 활성화 시 Safe Area Inset 제거 탐색(EXP-01-A) 및 (2) 상단 헤더 고정 시도(EXP-01-B)로 연계 결정.',
    },
  },
  {
    id: 'exp01_a',
    status: 'failed',
    title: {
      en: 'EXP-01-A: Dynamic Safe Area Inset',
      ko: 'EXP-01-A: Safe Area Inset 동적 제거 시도 (밀착 시도)',
    },
    hypothesis: {
      en: 'Detecting keyboard open via visualViewport.height < window.innerHeight - 80 and reducing safe-area-inset-bottom from 34px to 0px will snap input to keyboard.',
      ko: '키보드 오픈 감지(visualViewport.height < window.innerHeight - 80)를 통해 34px Safe Area Inset을 0px로 축소하면 키보드 밀착이 가능할 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Header pushed off-screen as Safari pans window up', ko: '사파리가 외부 창을 밀어올려 상단 헤더가 화면 위로 밀려 사라짐' } },
      { id: '1-2', status: 'fail', comment: { en: 'Dual-scroll occurs when scrolling on input area', ko: '인풋 영역 스크롤 시 이중 스크롤 발생' } },
      { id: '1-3', status: 'fail', comment: { en: 'Despite visualViewport.height detection attempt, 34px Safe Area Inset padding remains (identical to EXP-01)', ko: '키보드 감지(visualViewport.height < window.innerHeight - 80) 시도에도 불구하고 34px Safe Area Inset이 제거되지 않고 유지됨 (EXP-01과 동일)' } },
      { id: '1-4', status: 'pass', comment: { en: 'Safari pans window up, naturally keeping body bottom above input', ko: '사파리가 창을 올려 바디 하단 위치가 인풋 위에 자연 보존됨' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'In pure position: fixed layout, visualViewport.height < window.innerHeight - 80 detection and padding toggle fail to collapse the 34px gap.',
      ko: '순수 position: fixed 구조에서는 visualViewport.height < window.innerHeight - 80 감지 및 패딩 조작으로도 키보드 위 34px 공백이 제거되지 않음을 실증.',
    },
    nextDecision: {
      en: 'Synthesize findings with EXP-01-B to determine if position: fixed can be salvaged or must be abandoned.',
      ko: 'EXP-01-B(헤더 고정 시도) 결과와 종합하여 position: fixed 유지 가능 여부 최종 판단.',
    },
  },
  {
    id: 'exp01_b',
    status: 'failed',
    title: {
      en: 'EXP-01-B: Document Scroll Lock',
      ko: 'EXP-01-B: 포커스 시 scrollTo(0,0) 강제 락 (헤더 고정 시도)',
    },
    hypothesis: {
      en: 'Forcing window.scrollTo(0,0) on focus will keep the top header firmly pinned at (0,0).',
      ko: '인풋 포커스 시 스크롤을 즉시 (0,0)으로 잠그면 헤더라도 화면 상단에 견고하게 고정될 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header stays at (0,0) top position', ko: '상단 헤더 고정 성공' } },
      { id: '1-2', status: 'fail', comment: { en: 'FATAL: Input drops to bottom and is 100% COVERED by keyboard', ko: '치명적 결함: 문서를 (0,0)으로 내리니 인풋이 키보드 뒤에 깔려 완전히 사라짐!' } },
      { id: '1-3', status: 'fail', comment: { en: 'Input completely invisible behind keyboard', ko: '인풋 실종으로 여백 무의미' } },
      { id: '1-4', status: 'fail', comment: { en: 'Scroll resets to 0, losing body bottom anchor', ko: '스크롤이 0으로 리셋되어 바디 하단 앵커링 소실' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Proved the fundamental paradox: Locking window at (0,0) keeps header but traps input behind keyboard.',
      ko: 'fixed 요소를 (0,0)에 묶으면 헤더는 지키지만 인풋이 키보드 아래 갇히는 position: fixed의 원천적 한계 증명.',
    },
    nextDecision: {
      en: 'Combining EXP-01, 01-A, and 01-B results: position: fixed is physically unviable. Pivot completely to In-Flow Flexbox (EXP-02).',
      ko: 'EXP-01(오리지널), 01-A(밀착 시도), 01-B(헤더 락) 종합 결론: fixed 전면 폐기 및 In-Flow Flexbox(EXP-02)로 대전환 결정!',
    },
  },
  {
    id: 'exp02',
    status: 'failed',
    title: {
      en: 'EXP-02: Pure CSS 100dvh In-Flow',
      ko: 'EXP-02: 순수 CSS 100dvh In-Flow 레이아웃',
    },
    hypothesis: {
      en: 'CSS 100dvh + interactive-widget=resizes-content will auto-shrink container on iOS keyboard open with 0 lines of JS.',
      ko: 'CSS 100dvh 단위와 interactive-widget 설정을 사용하면 JS 없이도 WebKit이 키보드 크기만큼 컨테이너를 스스로 줄여줄 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: '100dvh ignores keyboard, causing window to pan', ko: '100dvh가 키보드를 무시하여 화면 전체가 밀려올라감' } },
      { id: '1-2', status: 'fail', comment: { en: 'Dual-scroll occurs when scrolling on input area', ko: '인풋 영역 스크롤 시 이중 스크롤 발생' } },
      { id: '1-3', status: 'fail', comment: { en: 'Layout clipping on drag', ko: '드래그 시 레이아웃 잘림' } },
      { id: '1-4', status: 'pass', comment: { en: 'Body bottom preserved via window shift', ko: '사파리 창 밀림으로 바디 하단 위치 자연 보존' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'iOS WebKit specification explicitly restricts dvh to browser URL bar collapse, ignoring virtual keyboard.',
      ko: 'iOS 사파리 WebKit 사양상 100dvh는 주소창에만 반응하고 가상 키보드 팝업 시에는 전혀 줄어들지 않고 전체 높이 유지.',
    },
    nextDecision: {
      en: 'Acknowledge CSS limits and bind window.visualViewport.height directly to Flex container in EXP-02-A.',
      ko: '순수 CSS 한계를 인정하고 JS window.visualViewport.height를 부모 Flex 컨테이너에 직접 주입하는 EXP-02-A로 전환.',
    },
  },
  {
    id: 'exp02_a',
    status: 'failed',
    title: {
      en: 'EXP-02-A: Dynamic visualViewport Binding',
      ko: 'EXP-02-A: visualViewport.height 1:1 주입',
    },
    hypothesis: {
      en: 'Injecting window.visualViewport.height directly into Flex container height will fit the layout to visible screen.',
      ko: '실시간 측정하는 visualViewport.height를 Flex 컨테이너 높이로 주입하면 키보드 가시 영역에 정상 안착할 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'WebKit initial scroll push creates 336px gap', ko: '초기 포커스 시 WebKit이 도화지를 밀어올려 336px 빈 공간 노출' } },
      { id: '1-2', status: 'pass', comment: { en: 'Single unified In-Flow scroll verified', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'fail', comment: { en: '336px massive empty space before manual scroll', ko: '수동 정렬 전 336px 거대 빈 공간 노출' } },
      { id: '1-4', status: 'fail', comment: { en: 'Reading anchor displaced by 336px', ko: '336px 오차로 바디 하단 앵커링 소실' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Proved In-Flow Flexbox is the correct foundation! But WebKit focus scroll pushes container up by 336px.',
      ko: 'In-Flow Flex 4단 정렬 뼈대 검증 성공! 단, 초기 포커스 시 WebKit이 도화지를 밀어올려 인풋 아래에 336px 빈 공간 노출.',
    },
    nextDecision: {
      en: 'Test top: 0 anchor lock (EXP-02-B) vs transform offset tracking (EXP-02-C) to auto-eliminate the 336px gap.',
      ko: '상단 top: 0 락(02-B)과 오프셋 추적(02-C)으로 336px 빈 공간을 자동 은폐하는 실험 착수.',
    },
  },
  {
    id: 'exp02_b',
    status: 'progress',
    title: {
      en: 'EXP-02-B: Top Anchor & Scroll Lock',
      ko: 'EXP-02-B: 상단 top: 0 고정 & 포커스 스크롤 락',
    },
    hypothesis: {
      en: 'Pinning container top: 0 and neutralizing WebKit focus scroll with scrollTo(0,0) will auto-hide the 336px gap.',
      ko: '컨테이너를 top: 0에 고정하고 루트 스크롤을 즉시 0으로 잠그면 아래쪽 336px 빈 공간이 키보드 밑으로 완벽히 가려질 것이다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: '1-frame visual jitter when rubbing input bar', ko: '인풋 바를 문지를 때 1프레임 미세 덜컹거림 발생' } },
      { id: '1-2', status: 'pass', comment: { en: 'Single unified scroll lands directly above keyboard', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset gap remains', ko: '키보드 활성화 시 34px Safe Area Inset 공백 미제거' } },
      { id: '1-4', status: 'fail', comment: { en: 'Reading line still jumps', ko: '바디 하단 앵커링 점프 발생' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Milestone victory: Pinning container to top: 0 is the winning architecture! Minor 1-frame jitter on touch drag.',
      ko: '도화지를 y=0에 묶어두는 02-B 방식이 최종 정답 아키텍처임이 증명됨. 단, 인풋 문지를 때 1프레임 미세 덜컹거림 발생.',
    },
    nextDecision: {
      en: 'Apply touch-action: none on input shell in EXP-02-D to achieve 100% zero-jank motionless lock.',
      ko: '인풋 쉘 자체에 touch-action: none을 걸어 1프레임 덜컹거림마저 박멸하는 EXP-02-D로 연계.',
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
      en: 'Tracking visualViewport.offsetTop with hardware-accelerated transform: translateY will eliminate visual jank.',
      ko: '스크롤을 막지 않고 오프셋을 읽어와 translateY로 컨테이너를 가시 영역에 1:1 따라가게 만든다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Severe strobe flickering due to 8ms JS vs Compositor latency', ko: '120Hz 화면 vs 60Hz JS 시차로 바닥 빈 공간이 번쩍이는 스트로브 결함' } },
      { id: '1-2', status: 'fail', comment: { en: 'Dual thread separation breaks smooth scroll', ko: '렌더링 스레드 시차로 단일 스크롤 붕괴' } },
      { id: '1-3', status: 'fail', comment: { en: 'Background flashes during drag', ko: '드래그 시 배경 번쩍임' } },
      { id: '1-4', status: 'fail', comment: { en: 'Reading line jitter', ko: '바디 하단 앵커링 흔들림' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'fail', comment: { en: 'Flickering on dismiss', ko: '닫힘 시 깜빡임 발생' } },
    ],
    keyFinding: {
      en: 'DISQUALIFIED: Compositor thread (120Hz) moves ahead of JS visualViewport.scroll (60Hz), creating strobe gaps.',
      ko: '탈락: 120Hz 렌더링 스레드와 60Hz JS 이벤트 간 8ms 물리적 시차로 인해 바닥이 번쩍이는 스트로브 결함 발생.',
    },
    nextDecision: {
      en: 'Permanently abandon offset tracking and commit 100% to pre-emptive top: 0 lock (02-B / 02-D).',
      ko: '오프셋 따라가기 방식을 영구 폐기하고, 도화지 자체를 미리 묶어두는 사전 차단(02-B / 02-D)을 최종 방향으로 확정.',
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
      en: 'Adding touch-action: none and non-passive touch prevention on input shell will eliminate the 1-frame jitter.',
      ko: '인풋 바 영역에 touch-action: none을 적용하여 인풋 바를 문질러도 브라우저가 바깥 스크롤을 0.001초도 시작하지 못하게 차단한다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Header still slides inside resizing container', ko: '헤더가 리사이징 컨테이너 안에 있어 슬라이드 발생' } },
      { id: '1-2', status: 'pass', comment: { en: '0-pixel motionless lock achieved when rubbing input shell', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'fail', comment: { en: '34px Safe Area Inset gap remains', ko: '키보드 활성화 시 34px Safe Area Inset 공백 미제거' } },
      { id: '1-4', status: 'fail', comment: { en: 'Reading line shifts on resize', ko: '컨테이너 축소 시 바디 하단 앵커링 이동' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Zero-jank architecture complete: Input shell is 100% motionless even during aggressive finger dragging.',
      ko: '인풋 바를 아무리 세게 문질러도 1프레임 흔들림 없는 0픽셀 완전 고정 아키텍처 완성.',
    },
    nextDecision: {
      en: 'Move to EXP-03-A to eliminate the 34px Safe Area Inset gap and snap input directly above keyboard.',
      ko: 'EXP-03-A로 연계하여 키보드 활성화 시 Safe Area Inset(34px)을 0px로 축소하고 키보드 초밀착 구현 착수.',
    },
  },
  {
    id: 'exp03_a',
    status: 'progress',
    title: {
      en: 'EXP-03-A: Zero-Gap Inset & HUD Relocation',
      ko: 'EXP-03-A: Safe Area Inset 0px 축소 & 8px 초밀착',
    },
    hypothesis: {
      en: 'Relocating HUD to body and collapsing safe-area padding to 8px when keyboard opens will achieve compact snap.',
      ko: '키보드 오픈 시점에는 Safe Area Inset(34px)을 즉시 0px로 축소하여 키보드 윗선에 8px 마진으로 초밀착시킨다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Header slides during container height contraction', ko: '컨테이너 축소 시 헤더 슬라이드 잔존' } },
      { id: '1-2', status: 'pass', comment: { en: 'Input perfectly visible with unified scroll', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: '34px Safe Area Inset eliminated; snaps with 8px compact margin', ko: '키보드 활성화 시 Safe Area Inset 완전 제거 및 8px 초밀착 성공' } },
      { id: '1-4', status: 'fail', comment: { en: '34px height delta causes 34px reading anchor shift', ko: '34px 인셋 축소로 인해 바디 하단 앵커링이 위로 34px 튀어 올라감' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: 'Compact 8px snap verified! But shrinking Safe Area by 34px shifts body scroll by exactly 34px.',
      ko: '키보드 활성화 시 Safe Area Inset 제거로 8px 초밀착 성공. 단, 바디 하단 앵커링이 34px 튀는 오차 확인.',
    },
    nextDecision: {
      en: 'Introduce ResizeObserver delta-H scroll compensation in EXP-03-B to achieve 0.0px Body Bottom Scroll Anchoring.',
      ko: '본문 ResizeObserver 기반 ΔH 실시간 1:1 스크롤 보정 수식을 도입하는 EXP-03-B로 연계.',
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
      en: 'Freezing baseline (S0, H0) and compensating scrollTop by exact body contraction (delta-H) will achieve 0.0px Scroll Anchoring.',
      ko: '닫혀 있을 때의 기준값(S0, H0)을 동결하고, 본문의 실제 축소량(ΔH)만큼만 스크롤을 보정하고 닫힐 때 S0로 1:1 복원한다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Header slides inside resizing container', ko: '헤더가 리사이징 컨테이너 안에 있어 슬라이드 잔존' } },
      { id: '1-2', status: 'pass', comment: { en: 'Unified single scroll verified', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: '8px bottom snap preserved', ko: '키보드 활성화 시 Safe Area Inset 제거 유지' } },
      { id: '1-4', status: 'pass', comment: { en: 'Reading line anchored with 0.0px visual drift!', ko: '바디 하단 위치가 0.0px 오차로 완벽 고정, 닫힘 시 1:1 완벽 원복 달성!' } },
      { id: '2-1', status: 'na', comment: { en: 'Focus handover not in scope (introduced in EXP-03-C)', ko: '포커스 핸드오버 미도입 단계 (EXP-03-C에서 도입 예정)' } },
      { id: '3-1', status: 'na', comment: { en: 'FSM restoration not in scope (introduced in EXP-03-D)', ko: 'FSM 복원 메커니즘 미도입 단계 (EXP-03-D에서 도입 예정)' } },
    ],
    keyFinding: {
      en: '0.0px Body Bottom Scroll Anchoring achieved! Reading text row stays 100% motionless on keyboard presentation and dismissal.',
      ko: '동결 기준값(S0, H0)과 ΔH 단일 수식으로 키보드가 열려도 바디 하단 위치가 0.0px 오차로 완벽 고정되는 쾌거 달성!',
    },
    nextDecision: {
      en: 'Implement body form input focus handover and floating suppression in EXP-03-C.',
      ko: '본문 폼 인풋 터치 시 하단 플로팅 바가 0px로 숨겨지는 Focus Handover를 구현하는 EXP-03-C로 연계.',
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
      en: 'Suppressing floating input to 0px when body inline form input is focused will avoid viewport conflicts.',
      ko: '본문 폼 인풋을 누르면 플로팅 바를 0px로 접어 본문 입력창을 확보하고, 블러 시 복원한다.',
    },
    evaluations: [
      { id: '1-1', status: 'fail', comment: { en: 'Header slide artifact remains inside resizing container', ko: '헤더가 리사이징 컨테이너 안에 있어 키보드 오픈 시 솟아오름' } },
      { id: '1-2', status: 'pass', comment: { en: 'Unified single scroll verified', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: '8px snap preserved', ko: '키보드 활성화 시 Safe Area Inset 제거 유지' } },
      { id: '1-4', status: 'pass', comment: { en: '0.0px reading anchor preserved', ko: '0.0px 바디 하단 스크롤 앵커링 유지' } },
      { id: '2-1', status: 'pass', comment: { en: 'Floating bar collapses to 0px when typing in body form', ko: '본문 폼 입력 시 플로팅 인풋 0px 자동 숨김 성공' } },
      { id: '3-1', status: 'fail', comment: { en: '1-frame flicker on keyboard dismiss after body input blur', ko: '본문 포커스 해제 후 닫힐 때 1프레임 깜빡임(Flicker) 결함 잔존' } },
    ],
    keyFinding: {
      en: 'Dual input conflict solved! But header slide artifact and dismiss flicker remain.',
      ko: '본문 폼 입력 시 플로팅 바 0px 은폐 성공! 단, 헤더 솟아오름 현상과 닫힐 때 깜빡임 잔존 확인.',
    },
    nextDecision: {
      en: 'Physically isolate header outside resizing container and implement 3-state FSM in EXP-03-D.',
      ko: '헤더를 뷰포트 수축 컨테이너 밖으로 완전히 물리적 격리하고 3-상태 FSM을 도입하는 EXP-03-D (Winner)로 연계.',
    },
  },
  {
    id: 'exp03_d',
    status: 'winner',
    title: {
      en: 'EXP-03-D: Isolated Fixed Header & Zero-Jerk Top Anchor (WINNER ★)',
      ko: 'EXP-03-D: 상단 헤더 물리적 격리 & Zero-Shift 완성형 (WINNER ★)',
    },
    hypothesis: {
      en: 'Decoupling header outside visualViewport container + preventScroll + 350ms rAF lock + 3-state FSM achieves Native App Parity.',
      ko: '헤더를 수축 컨테이너 바깥 최상단에 물리적으로 격리 고정하고, preventScroll과 350ms rAF 락, 3-상태 FSM을 결합하면 완벽한 상단 헤더 고정과 네이티브 앱 동등 수준을 달성할 수 있다.',
    },
    evaluations: [
      { id: '1-1', status: 'pass', comment: { en: 'Header physically isolated; motionless top-lock achieved!', ko: '헤더 물리 격리 + 350ms rAF 락으로 상단 헤더 고정 완벽 달성!' } },
      { id: '1-2', status: 'pass', comment: { en: 'Single unified scroll with 100% feed reachability', ko: '단일 스크롤로 매끄럽게 통합 유지' } },
      { id: '1-3', status: 'pass', comment: { en: 'Safe Area removed on open; snaps with compact margin', ko: '키보드 활성화 시 Safe Area Inset 제거 및 12px 초밀착 성공' } },
      { id: '1-4', status: 'pass', comment: { en: 'Reading line anchored with 0.0px visual drift', ko: '동결 기준값 기반 0.0px 바디 하단 스크롤 앵커링 완벽 고정' } },
      { id: '2-1', status: 'pass', comment: { en: 'Floating bar suppresses to 0px seamlessly during body form input', ko: '본문 폼 입력 시 플로팅 인풋 0px 자동 숨김 완벽 작동' } },
      { id: '3-1', status: 'pass', comment: { en: '3-state FSM eliminates dismiss flicker 100%', ko: '3-상태 FSM 도입으로 포커스 해제 시 깜빡임 완전 박멸!' } },
    ],
    keyFinding: {
      en: 'Native App Parity achieved! Header top-lock, single unified scroll, 0.0px Body Bottom Scroll Anchoring, compact snap, and zero flicker across all iOS devices.',
      ko: '상단 헤더 고정 + 단일 스크롤 + 0.0px 바디 하단 스크롤 앵커링 + Safe Area Inset 제거 + FSM 깜빡임 완전 박멸로 네이티브 앱 동등 수준 달성!',
    },
    nextDecision: {
      en: 'Adopted as the core production engine of react-mobile-keyboard-layout library!',
      ko: 'react-mobile-keyboard-layout 라이브러리의 공식 정품 프로덕션 엔진으로 채택 및 최종 배포!',
    },
  },
]
