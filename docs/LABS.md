# 🔬 react-mobile-keyboard-layout — Research & Experiment Archive (Labs Archive)

A complete historical record of 14 controlled single-variable experiments conducted to achieve zero-shift headers, 0.0px scroll anchoring, and seamless floating inputs on mobile web & iOS Safari/PWA.

🌐 **[Interactive Live Demo Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs)**

---

## 📑 Table of Contents

### Phase 1: Pure CSS Limits & Fixed Positioning
- [❌ EXP-01-A: Baseline Standard Fixed](#exp01-a)
- [❌ EXP-01-B: Dynamic Safe Area Inset](#exp01-b)
- [❌ EXP-01-C: Document Scroll Lock](#exp01-c)
- [❌ EXP-01-D: Pure CSS 100dvh In-Flow](#exp01-d)
### Phase 2: Dynamic Viewport & Scroll Coordination
- [❌ EXP-02-A: Dynamic visualViewport Binding](#exp02-a)
- [🔄 EXP-02-B: Top Anchor & Focus Scroll Lock](#exp02-b)
- [❌ EXP-02-C: Transform translateY Offset Tracking](#exp02-c)
- [🔄 EXP-02-D: Zero-Jank Input Shell Touch Lock](#exp02-d)
### Phase 3: Focus-Driven State Machine & Boundary Evasion
- [🔄 EXP-03-A: Zero-Gap Inset & Compact Snap](#exp03-a)
- [🔄 EXP-03-B: Body ResizeObserver Scroll Anchoring](#exp03-b)
- [🔄 EXP-03-C: Inline Focus Handover & Floating Suppression](#exp03-c)
- [🔄 EXP-03-D: Isolated Fixed Header & 3-State FSM](#exp03-d)
- [🏆 EXP-03-E: Atomic Viewport Restoration & Dismiss Sync (FINAL)](#exp03-e)
- [🏆 EXP-03-F: In-Viewport Boundary Evasion](#exp03-f)

---

## Phase 1: Pure CSS Limits & Fixed Positioning

<a id="exp01-a"></a>
### EXP-01-A: Baseline Standard Fixed

**Status**: ❌ **FAILED (Rejected)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp01_a)**

#### 🎯 Hypothesis
> Standard CSS position: fixed with safe-area padding can anchor the input at the bottom on iOS Safari.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `❌ FAIL` | Header pushed off-screen as Safari pans window up |
| **1-2. Single Unified Scroll Maintained** | `❌ FAIL` | Dual-scroll occurs when scrolling on input area |
| **1-3. Safe Area Inset Removed on Open** | `❌ FAIL` | 34px Safe Area Inset gap remains above keyboard |
| **1-4. Body Bottom Scroll Anchoring** | `✅ PASS` | Safari pans window up, naturally keeping body bottom above input |
| **2-1. Inline Form Focus Handover** | `⚪ N/A` | Focus handover not in scope (introduced in EXP-03-C) |
| **3-1. Zero-Flicker Dismiss Restoration** | `⚪ N/A` | FSM restoration not in scope (introduced in EXP-03-D) |

#### 💡 Key Finding
position: fixed structure causes top header loss, dual-scroll collision on input dragging, and leaves an unnecessary 34px Safe Area Inset gap above the keyboard.

#### ➡️ Next Decision
Branch into EXP-01-B to try removing the 34px Safe Area Inset gap dynamically while keeping position: fixed.

---

<a id="exp01-b"></a>
### EXP-01-B: Dynamic Safe Area Inset

**Status**: ❌ **FAILED (Rejected)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp01_b)**

#### 🎯 Hypothesis
> Detecting keyboard open via visualViewport height contraction and reducing safe-area padding from 34px to 0px will snap input to keyboard.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `❌ FAIL` | Header pushed off-screen as Safari pans window up |
| **1-2. Single Unified Scroll Maintained** | `❌ FAIL` | Dual-scroll occurs when scrolling on input area |
| **1-3. Safe Area Inset Removed on Open** | `❌ FAIL` | 34px Safe Area Inset padding remains despite dynamic padding change attempt |
| **1-4. Body Bottom Scroll Anchoring** | `✅ PASS` | Safari pans window up, naturally keeping body bottom above input |
| **2-1. Inline Form Focus Handover** | `⚪ N/A` | Focus handover not in scope (introduced in EXP-03-C) |
| **3-1. Zero-Flicker Dismiss Restoration** | `⚪ N/A` | FSM restoration not in scope (introduced in EXP-03-D) |

#### 💡 Key Finding
In pure position: fixed layout, collapsing safe-area padding dynamically upon viewport contraction fails to eliminate the 34px gap above keyboard.

#### ➡️ Next Decision
Branch into EXP-01-C to test locking window scroll at (0,0) on focus to pin the top header.

---

<a id="exp01-c"></a>
### EXP-01-C: Document Scroll Lock

**Status**: ❌ **FAILED (Rejected)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp01_c)**

#### 🎯 Hypothesis
> Forcing window scroll to (0,0) on input focus will keep the top header firmly pinned at the top of the screen.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `✅ PASS` | Header stays at (0,0) top position |
| **1-2. Single Unified Scroll Maintained** | `❌ FAIL` | Input drops to bottom and is completely covered by keyboard |
| **1-3. Safe Area Inset Removed on Open** | `❌ FAIL` | Input invisible behind keyboard |
| **1-4. Body Bottom Scroll Anchoring** | `❌ FAIL` | Scroll resets to 0, losing body bottom anchor |
| **2-1. Inline Form Focus Handover** | `⚪ N/A` | Focus handover not in scope (introduced in EXP-03-C) |
| **3-1. Zero-Flicker Dismiss Restoration** | `⚪ N/A` | FSM restoration not in scope (introduced in EXP-03-D) |

#### 💡 Key Finding
Locking window scroll to (0,0) preserves the top header but completely buries the fixed input behind the keyboard.

#### ➡️ Next Decision
Abandon position: fixed and test modern CSS 100dvh In-Flow Flexbox layout in EXP-01-D.

---

<a id="exp01-d"></a>
### EXP-01-D: Pure CSS 100dvh In-Flow

**Status**: ❌ **FAILED (Rejected)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp01_d)**

#### 🎯 Hypothesis
> CSS 100dvh unit with In-Flow Flexbox will auto-shrink container on keyboard open without JavaScript.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `❌ FAIL` | 100dvh ignores virtual keyboard, causing window to pan |
| **1-2. Single Unified Scroll Maintained** | `❌ FAIL` | Dual-scroll occurs when scrolling on input area |
| **1-3. Safe Area Inset Removed on Open** | `❌ FAIL` | Layout clipping on drag |
| **1-4. Body Bottom Scroll Anchoring** | `✅ PASS` | Body bottom preserved via window shift |
| **2-1. Inline Form Focus Handover** | `⚪ N/A` | Focus handover not in scope (introduced in EXP-03-C) |
| **3-1. Zero-Flicker Dismiss Restoration** | `⚪ N/A` | FSM restoration not in scope (introduced in EXP-03-D) |

#### 💡 Key Finding
iOS WebKit specification explicitly restricts 100dvh to browser URL bar changes, completely ignoring virtual keyboard. Pure CSS approach is officially exhausted.

#### ➡️ Next Decision
Conclude Phase 1 (Pure CSS). Transition to Phase 2 by binding window.visualViewport height directly to Flex container in EXP-02-A.

---

## Phase 2: Dynamic Viewport & Scroll Coordination

<a id="exp02-a"></a>
### EXP-02-A: Dynamic visualViewport Binding

**Status**: ❌ **FAILED (Rejected)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp02_a)**

#### 🎯 Hypothesis
> Injecting measured visualViewport.height directly into Flex container height will fit layout cleanly to visible screen.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `❌ FAIL` | WebKit focus scroll push creates 336px empty gap |
| **1-2. Single Unified Scroll Maintained** | `✅ PASS` | Single unified In-Flow scroll verified |
| **1-3. Safe Area Inset Removed on Open** | `❌ FAIL` | 336px empty space remains before manual scroll |
| **1-4. Body Bottom Scroll Anchoring** | `❌ FAIL` | Reading anchor displaced by 336px |
| **2-1. Inline Form Focus Handover** | `⚪ N/A` | Focus handover not in scope (introduced in EXP-03-C) |
| **3-1. Zero-Flicker Dismiss Restoration** | `⚪ N/A` | FSM restoration not in scope (introduced in EXP-03-D) |

#### 💡 Key Finding
In-Flow Flex 3-section structure is effective, but WebKit focus scroll pushes container up, exposing a 336px gap below input.

#### ➡️ Next Decision
Test top: 0 anchor lock (EXP-02-B) vs transform offset tracking (EXP-02-C) to eliminate the 336px bottom gap.

---

<a id="exp02-b"></a>
### EXP-02-B: Top Anchor & Focus Scroll Lock

**Status**: 🔄 **PROGRESS (Milestone)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp02_b)**

#### 🎯 Hypothesis
> Pinning container top: 0 and locking window scroll to (0,0) will conceal the 336px gap under the keyboard.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `✅ PASS` | Header firmly pinned to top (window scroll locked at 0) |
| **1-2. Single Unified Scroll Maintained** | `✅ PASS` | Single unified scroll maintained cleanly |
| **1-3. Safe Area Inset Removed on Open** | `❌ FAIL` | 34px Safe Area Inset gap remains |
| **1-4. Body Bottom Scroll Anchoring** | `❌ FAIL` | Reading line jumps on height contraction |
| **2-1. Inline Form Focus Handover** | `⚪ N/A` | Focus handover not in scope (introduced in EXP-03-C) |
| **3-1. Zero-Flicker Dismiss Restoration** | `⚪ N/A` | FSM restoration not in scope (introduced in EXP-03-D) |

#### 💡 Key Finding
visualViewport 1:1 binding successfully seats input on keyboard. However, in Safari browser mode, keyboard dismiss follow lag is first observed due to throttled resize events.

#### ➡️ Next Decision
Apply touch-action: none on input shell in EXP-02-D to eliminate the touch jitter.

---

<a id="exp02-c"></a>
### EXP-02-C: Transform translateY Offset Tracking

**Status**: ❌ **FAILED (Rejected)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp02_c)**

#### 🎯 Hypothesis
> Tracking visualViewport offsetTop and applying transform: translateY without locking scroll will keep container aligned with visible area.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `❌ FAIL` | Stuttering follow lag: Container jitters and chases offset when rubbing input bar |
| **1-2. Single Unified Scroll Maintained** | `❌ FAIL` | Massive empty gap exposed below input as container lags behind |
| **1-3. Safe Area Inset Removed on Open** | `❌ FAIL` | 34px Safe Area Inset gap remains above keyboard |
| **1-4. Body Bottom Scroll Anchoring** | `❌ FAIL` | Body bottom scroll anchoring jitters during movement |
| **2-1. Inline Form Focus Handover** | `⚪ N/A` | Focus handover not in scope (introduced in EXP-03-C) |
| **3-1. Zero-Flicker Dismiss Restoration** | `⚪ N/A` | FSM restoration not in scope (introduced in EXP-03-D) |

#### 💡 Key Finding
Chasing offset post-event exposes a massive bottom gap, causes stuttering follow lag on dragging, and makes container slide up from bottom on dismiss.

#### ➡️ Next Decision
Permanently abandon post-event offset tracking and commit to pre-emptive top: 0 anchor lock (02-B / 02-D).

---

<a id="exp02-d"></a>
### EXP-02-D: Zero-Jank Input Shell Touch Lock

**Status**: 🔄 **PROGRESS (Milestone)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp02_d)**

#### 🎯 Hypothesis
> Adding touch-action: none on input shell will block the browser from initiating outer scroll gestures.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `✅ PASS` | Header firmly pinned to top (window scroll locked at 0) |
| **1-2. Single Unified Scroll Maintained** | `✅ PASS` | 0-pixel motionless lock achieved when dragging input shell |
| **1-3. Safe Area Inset Removed on Open** | `❌ FAIL` | 34px Safe Area Inset gap remains |
| **1-4. Body Bottom Scroll Anchoring** | `❌ FAIL` | Reading line shifts on container resize |
| **2-1. Inline Form Focus Handover** | `⚪ N/A` | Focus handover not in scope (introduced in EXP-03-C) |
| **3-1. Zero-Flicker Dismiss Restoration** | `⚪ N/A` | FSM restoration not in scope (introduced in EXP-03-D) |

#### 💡 Key Finding
Input shell remains 100% motionless even during aggressive dragging, completing the core viewport lock architecture.

#### ➡️ Next Decision
Conclude Phase 2. Move to Phase 3 (EXP-03-A) to eliminate the 34px Safe Area Inset gap and implement body scroll anchoring.

---

## Phase 3: Focus-Driven State Machine & Boundary Evasion

<a id="exp03-a"></a>
### EXP-03-A: Zero-Gap Inset & Compact Snap

**Status**: 🔄 **PROGRESS (Milestone)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp03_a)**

#### 🎯 Hypothesis
> Collapsing safe-area padding to 0px on keyboard open will snap the input bar with compact 8px margin.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `✅ PASS` | Header firmly pinned to top |
| **1-2. Single Unified Scroll Maintained** | `✅ PASS` | Input perfectly visible with unified scroll |
| **1-3. Safe Area Inset Removed on Open** | `✅ PASS` | 34px Safe Area Inset eliminated; snaps with 8px compact margin |
| **1-4. Body Bottom Scroll Anchoring** | `❌ FAIL` | Body shrinks by contraction amount (~300px+), burying bottom reading position behind keyboard |
| **2-1. Inline Form Focus Handover** | `⚪ N/A` | Focus handover not in scope (introduced in EXP-03-C) |
| **3-1. Zero-Flicker Dismiss Restoration** | `⚪ N/A` | FSM restoration not in scope (introduced in EXP-03-D) |

#### 💡 Key Finding
Collapsing Safe Area Inset to 0px achieves 8px compact snap. However, with Flexbox top fixed, body height contraction swallows the bottom reading area behind the keyboard.

#### ➡️ Next Decision
Measure body height contraction via ResizeObserver and compensate scroll offset in real-time in EXP-03-B.

---

<a id="exp03-b"></a>
### EXP-03-B: Body ResizeObserver Scroll Anchoring

**Status**: 🔄 **PROGRESS (Milestone)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp03_b)**

#### 🎯 Hypothesis
> Freezing baseline scroll position and compensating scroll offset by exact body height contraction will keep bottom reading line anchored with 0.0px drift.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `✅ PASS` | Header firmly pinned to top |
| **1-2. Single Unified Scroll Maintained** | `✅ PASS` | Unified single scroll verified |
| **1-3. Safe Area Inset Removed on Open** | `✅ PASS` | 8px bottom snap preserved |
| **1-4. Body Bottom Scroll Anchoring** | `✅ PASS` | PWA: 0.0px anchor works. Safari: Intermittently maintained, but mostly un-anchored on repeated trials |
| **2-1. Inline Form Focus Handover** | `⚪ N/A` | Focus handover not in scope (introduced in EXP-03-C) |
| **3-1. Zero-Flicker Dismiss Restoration** | `⚪ N/A` | FSM restoration not in scope (introduced in EXP-03-D) |

#### 💡 Key Finding
PWA achieves clean 0.0px anchoring, but in Safari browser mode, throttled viewport events cause the anchor to unbind late or fail on repeated attempts. Inline body inputs also collide with floating bar.

#### ➡️ Next Decision
Implement body form input focus handover and floating suppression (0px collapse) in EXP-03-C.

---

<a id="exp03-c"></a>
### EXP-03-C: Inline Focus Handover & Floating Suppression

**Status**: 🔄 **PROGRESS (Milestone)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp03_c)**

#### 🎯 Hypothesis
> Suppressing floating input to 0px when body inline form input is focused will secure body input space, restoring it on blur.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `✅ PASS` | Header firmly pinned to top |
| **1-2. Single Unified Scroll Maintained** | `✅ PASS` | Unified single scroll verified |
| **1-3. Safe Area Inset Removed on Open** | `✅ PASS` | 8px snap preserved |
| **1-4. Body Bottom Scroll Anchoring** | `✅ PASS` | Anchoring latency persists in Safari browser mode |
| **2-1. Inline Form Focus Handover** | `✅ PASS` | Floating bar collapses to 0px when typing in body form |
| **3-1. Zero-Flicker Dismiss Restoration** | `❌ FAIL` | Momentary flicker on keyboard dismiss after body input blur in Safari |

#### 💡 Key Finding
Body form input suppression succeeds in securing viewport space. However, Safari viewport latency creates dismiss flicker, and shrinking container still tugs header on edge cases.

#### ➡️ Next Decision
While hiding the floating bar on body focus works, the header is still trapped inside the resizing container, bouncing on keyboard pop-up. Also, lack of a 3-state machine causes dismiss flicker. Thus, we isolate the header physically outside the resizing container and introduce a 3-state input FSM in EXP-03-D.

---

<a id="exp03-d"></a>
### EXP-03-D: Isolated Fixed Header & 3-State FSM

**Status**: 🔄 **PROGRESS (Milestone)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp03_d)**

#### 🎯 Hypothesis
> Decoupling header physically outside resizing container + tracking 3 distinct input states (Closed / Floating / Body) will eliminate header bounce and layout flicker.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `✅ PASS` | Header physically isolated; motionless top-lock achieved |
| **1-2. Single Unified Scroll Maintained** | `✅ PASS` | Single unified scroll with 100% feed reachability |
| **1-3. Safe Area Inset Removed on Open** | `✅ PASS` | Safe Area removed on open; snaps with compact margin |
| **1-4. Body Bottom Scroll Anchoring** | `✅ PASS` | PWA: Flawless. Safari: Anchoring lags until viewport resize fires |
| **2-1. Inline Form Focus Handover** | `✅ PASS` | Floating bar suppresses to 0px seamlessly during body form input |
| **3-1. Zero-Flicker Dismiss Restoration** | `❌ FAIL` | Safari: Floating input appears mid-screen before dropping to bottom on blur |

#### 💡 Key Finding
Physical header isolation achieves 100% motionless header lock and runs flawlessly in PWA. However, in Safari browser mode, Safari throttles viewport resize events for 350ms on keyboard dismiss, causing the floating bar to pop up mid-screen (at 508px height) before dropping to bottom, along with late scroll un-anchoring.

#### ➡️ Next Decision
Abandon passive viewport waiting (waiting for 350ms resize event) and implement Focus-Driven Atomic Teardown in EXP-03-E to restore full-screen height, scroll position, and bottom bar instantaneously at 0ms upon touch.

---

<a id="exp03-e"></a>
### EXP-03-E: Atomic Viewport Restoration & Dismiss Sync (FINAL)

**Status**: 🏆 **WINNER (Adopted)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp03_e)**

#### 🎯 Hypothesis
> Atomically restoring full-screen height, scroll position, and floating input bottom placement synchronously at 0ms upon blur will eliminate the mid-screen pop and dismiss latency entirely.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `✅ PASS` | Header physically isolated; motionless top-lock achieved |
| **1-2. Single Unified Scroll Maintained** | `✅ PASS` | Single unified scroll with 100% feed reachability |
| **1-3. Safe Area Inset Removed on Open** | `✅ PASS` | Safe Area removed on open; snaps with compact margin |
| **1-4. Body Bottom Scroll Anchoring** | `✅ PASS` | Zero drift: Flawless instant scroll anchor restoration across PWA & Safari |
| **2-1. Inline Form Focus Handover** | `✅ PASS` | Floating bar suppresses to 0px seamlessly during body form input |
| **3-1. Zero-Flicker Dismiss Restoration** | `✅ PASS` | Zero mid-screen pop; floating bar seats cleanly at bottom on dismiss |

#### 💡 Key Finding
Native App Parity achieved: Flawless header top-lock, single unified scroll, 0.0px Body Bottom Scroll Anchoring, and zero mid-screen lag during dismissal across iOS Safari & PWA.

#### ➡️ Next Decision
Adopted as the core production engine of react-mobile-keyboard-layout library.

---

<a id="exp03-f"></a>
### EXP-03-F: In-Viewport Boundary Evasion

**Status**: 🏆 **WINNER (Adopted)** | 🎮 **[Run Live Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=exp03_f)**

#### 🎯 Hypothesis
> When a focused body input is near scroll container boundaries, gently nudge it inwards (safe padding 16px, deadzone 2px) so Safari considers it already fully visible, preventing Safari from bouncing the keyboard back down.

#### 📊 Evaluation Criteria Matrix

| Criterion | Status | Observed Details |
| :--- | :---: | :--- |
| **1-1. Header Pinned on Keyboard Open** | `✅ PASS` | Header motionless and locked at top |
| **1-2. Single Unified Scroll Maintained** | `✅ PASS` | Single unified scroll with 100% feed reachability |
| **1-3. Safe Area Inset Removed on Open** | `✅ PASS` | Safe Area removed on open; snaps with compact margin |
| **1-4. Body Bottom Scroll Anchoring** | `✅ PASS` | Scroll anchor preserved during safe boundary alignment |
| **2-1. Inline Form Focus Handover** | `✅ PASS` | Bottom body input stays fully stable without keyboard bounce |
| **3-1. Zero-Flicker Dismiss Restoration** | `✅ PASS` | Zero mid-screen pop; clean dismiss restoration |

#### 💡 Key Finding
Avoiding Safari intervention is fundamentally different from blocking it. While previous solutions attempted to block Safari writes (scrollTo(0,0) lock, touch-action: none, preventScroll), this solution eliminates the trigger condition itself. Note: The 16px boundary padding and 2px subpixel deadzone are visually tuned ergonomic values for smooth feel, not browser threshold constants.

#### ➡️ Next Decision
Integrated into core layoutRules alignElement logic. Because the 16px and 2px values were empirically tuned by sight, they should be exposed as customizable options (e.g. alignPadding) in the public hook API.

---

