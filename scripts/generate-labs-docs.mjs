/* global console */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Read labsData.ts source
const labsDataFile = path.join(rootDir, 'apps/showcase/src/data/labsData.ts')
const content = fs.readFileSync(labsDataFile, 'utf8')

// Parse LABS_DATA JSON-like structure
const cleanedTs = content
  .replace(/export interface[\s\S]*?export const LABS_DATA: LabInfo\[\] = /, '')
  .trim()
  .replace(/;$/, '')

const LABS_DATA = eval(`(${cleanedTs})`)

const CRITERIA_MAP = {
  '1-1': {
    en: '1-1. Header Pinned on Keyboard Open',
    ko: '1-1. 키보드 활성화 시 상단 헤더 고정',
  },
  '1-2': {
    en: '1-2. Single Unified Scroll Maintained',
    ko: '1-2. 키보드 활성화 시 단일 스크롤 유지',
  },
  '1-3': {
    en: '1-3. Safe Area Inset Removed on Open',
    ko: '1-3. 키보드 활성화 시 Safe Area Inset 제거',
  },
  '1-4': {
    en: '1-4. Body Bottom Scroll Anchoring',
    ko: '1-4. 키보드 활성화 시 바디 하단 스크롤 앵커링',
  },
  '2-1': {
    en: '2-1. Inline Form Focus Handover',
    ko: '2-1. 본문 폼 입력 시 포커스 핸드오버',
  },
  '3-1': {
    en: '3-1. Zero-Flicker Dismiss Restoration',
    ko: '3-1. 본문 포커스 해제 시 깜빡임 없는 복원',
  },
}

const getPhase = (id) => {
  if (id.startsWith('exp01')) return 1
  if (id.startsWith('exp02')) return 2
  return 3
}

const PHASE_TITLES = {
  1: {
    en: 'Phase 1: Pure CSS Limits & Fixed Positioning',
    ko: 'Phase 1: 순수 CSS의 한계와 Fixed 포지셔닝 검증',
  },
  2: {
    en: 'Phase 2: Dynamic Viewport & Scroll Coordination',
    ko: 'Phase 2: 동적 뷰포트 연동과 스크롤 제어 검증',
  },
  3: {
    en: 'Phase 3: Focus-Driven State Machine & Boundary Evasion',
    ko: 'Phase 3: 포커스 주도 상태 기계 & 뷰포트 경계 회피 (최종 완성)',
  },
}

const formatAnchor = (id) => id.replace('_', '-')

function generateMarkdown(lang) {
  const isKo = lang === 'ko'
  const title = isKo
    ? '# 🔬 react-mobile-keyboard-layout — 실험 및 연구 기록집 (Labs Archive)'
    : '# 🔬 react-mobile-keyboard-layout — Research & Experiment Archive (Labs Archive)'

  const subtitle = isKo
    ? `모바일 웹 및 iOS Safari/PWA 환경에서 하단 고정 입력창(Floating Input)과 상단 고정 헤더, 스크롤 앵커링을 구현하기 위해 수행된 14단계 단일 변수 통제 실험의 전체 기록입니다.\n\n🌐 **[라이브 대화형 샌드박스 바로가기](https://react-mobile-keyboard-layout.pages.dev/#labs)**`
    : `A complete historical record of 14 controlled single-variable experiments conducted to achieve zero-shift headers, 0.0px scroll anchoring, and seamless floating inputs on mobile web & iOS Safari/PWA.\n\n🌐 **[Interactive Live Demo Sandbox](https://react-mobile-keyboard-layout.pages.dev/#labs)**`

  let md = `${title}\n\n${subtitle}\n\n---\n\n## 📑 Table of Contents\n\n`

  let currentPhase = 0
  for (const lab of LABS_DATA) {
    const phase = getPhase(lab.id)
    if (phase !== currentPhase) {
      currentPhase = phase
      md += `### ${PHASE_TITLES[phase][lang]}\n`
    }
    const anchor = formatAnchor(lab.id)
    const statusEmoji = lab.status === 'winner' ? '🏆' : lab.status === 'progress' ? '🔄' : '❌'
    md += `- [${statusEmoji} ${lab.title[lang]}](#${anchor})\n`
  }

  md += '\n---\n\n'

  currentPhase = 0
  for (const lab of LABS_DATA) {
    const phase = getPhase(lab.id)
    if (phase !== currentPhase) {
      currentPhase = phase
      md += `## ${PHASE_TITLES[phase][lang]}\n\n`
    }

    const anchor = formatAnchor(lab.id)
    const statusBadge = lab.status === 'winner'
      ? (isKo ? '🏆 **WINNER (채택)**' : '🏆 **WINNER (Adopted)**')
      : lab.status === 'progress'
      ? (isKo ? '🔄 **PROGRESS (과도기)**' : '🔄 **PROGRESS (Milestone)**')
      : (isKo ? '❌ **FAILED (탈락)**' : '❌ **FAILED (Rejected)**')

    md += `<a id="${anchor}"></a>\n`
    md += `### ${lab.title[lang]}\n\n`
    md += `**Status**: ${statusBadge} | 🎮 **[${isKo ? '이 실험 샌드박스 실행' : 'Run Live Sandbox'}](https://react-mobile-keyboard-layout.pages.dev/#labs?exp=${lab.id})**\n\n`
    md += `#### 🎯 ${isKo ? '실험 가설' : 'Hypothesis'}\n`
    md += `> ${lab.hypothesis[lang]}\n\n`

    md += `#### 📊 ${isKo ? '6대 평가 기준 매트릭스' : 'Evaluation Criteria Matrix'}\n\n`
    md += `| ${isKo ? '평가 항목' : 'Criterion'} | ${isKo ? '결과' : 'Status'} | ${isKo ? '상세 결과 및 관찰 내용' : 'Observed Details'} |\n`
    md += `| :--- | :---: | :--- |\n`

    for (const ev of lab.evaluations) {
      const criterionName = CRITERIA_MAP[ev.id][lang]
      const statusIcon = ev.status === 'pass' ? '✅ PASS' : ev.status === 'fail' ? '❌ FAIL' : '⚪ N/A'
      md += `| **${criterionName}** | \`${statusIcon}\` | ${ev.comment[lang]} |\n`
    }

    md += `\n#### 💡 ${isKo ? '핵심 발견점 (Key Finding)' : 'Key Finding'}\n`
    md += `${lab.keyFinding[lang]}\n\n`

    md += `#### ➡️ ${isKo ? '다음 설계 결정 (Next Decision)' : 'Next Decision'}\n`
    md += `${lab.nextDecision[lang]}\n\n`
    md += `---\n\n`
  }

  return md
}

function generateHTML(lang) {
  const isKo = lang === 'ko'
  const pageTitle = isKo
    ? 'react-mobile-keyboard-layout — 실험 및 연구 아카이브 (Labs Archive)'
    : 'react-mobile-keyboard-layout — Research & Experiments Archive'

  let bodyHTML = `
  <header class="header">
    <div class="header-inner">
      <div class="brand">
        <span class="brand-title">react-mobile-keyboard-layout</span>
        <span class="brand-badge">LABS ARCHIVE</span>
      </div>
      <div class="header-actions">
        <a href="/${isKo ? 'labs.html' : 'labs.ko.html'}" class="btn-lang">${isKo ? 'English' : '한국어'}</a>
        <a href="/#labs" class="btn-primary">🎮 ${isKo ? '라이브 데모 샌드박스' : 'Live Interactive Demo'}</a>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="hero">
      <h1>🔬 ${pageTitle}</h1>
      <p class="subtitle">
        ${isKo
          ? '모바일 웹 및 iOS Safari/PWA 환경에서 하단 고정 입력창(Floating Input)과 상단 고정 헤더, 스크롤 앵커링을 구현하기 위해 수행된 14단계 단일 변수 통제 실험의 전체 기록입니다.'
          : 'A complete historical record of 14 controlled single-variable experiments conducted to achieve zero-shift headers, 0.0px scroll anchoring, and seamless floating inputs on mobile web & iOS Safari/PWA.'}
      </p>
    </div>

    <nav class="toc-card">
      <h2>📑 ${isKo ? '목차 (Table of Contents)' : 'Table of Contents'}</h2>
      <div class="toc-grid">
  `

  let currentPhase = 0
  for (const lab of LABS_DATA) {
    const phase = getPhase(lab.id)
    if (phase !== currentPhase) {
      if (currentPhase !== 0) bodyHTML += `</div></div>`
      currentPhase = phase
      bodyHTML += `
        <div class="toc-phase">
          <h3>${PHASE_TITLES[phase][lang]}</h3>
          <div class="toc-list">
      `
    }
    const anchor = formatAnchor(lab.id)
    const statusClass = lab.status === 'winner' ? 'status-winner' : lab.status === 'progress' ? 'status-progress' : 'status-failed'
    const statusText = lab.status === 'winner' ? 'WINNER' : lab.status === 'progress' ? 'PROGRESS' : 'FAILED'
    bodyHTML += `
      <a href="#${anchor}" class="toc-item">
        <span class="badge ${statusClass}">${statusText}</span>
        <span class="toc-label">${lab.title[lang]}</span>
      </a>
    `
  }
  bodyHTML += `</div></div></div></nav>`

  currentPhase = 0
  for (const lab of LABS_DATA) {
    const phase = getPhase(lab.id)
    if (phase !== currentPhase) {
      currentPhase = phase
      bodyHTML += `<div class="phase-divider"><h2>${PHASE_TITLES[phase][lang]}</h2></div>`
    }

    const anchor = formatAnchor(lab.id)
    const statusClass = lab.status === 'winner' ? 'status-winner' : lab.status === 'progress' ? 'status-progress' : 'status-failed'
    const statusText = lab.status === 'winner' ? '🏆 WINNER (채택)' : lab.status === 'progress' ? '🔄 PROGRESS (과도기)' : '❌ FAILED (탈락)'

    bodyHTML += `
      <section id="${anchor}" class="lab-card">
        <div class="lab-header">
          <div class="lab-title-group">
            <span class="badge ${statusClass}">${statusText}</span>
            <h3>${lab.title[lang]}</h3>
          </div>
          <a href="/#labs?exp=${lab.id}" class="sandbox-btn" target="_blank">🎮 ${isKo ? '샌드박스 실행' : 'Run Sandbox'}</a>
        </div>

        <div class="section-block">
          <div class="section-label">🎯 ${isKo ? '실험 가설' : 'Hypothesis'}</div>
          <p class="hypothesis-text">${lab.hypothesis[lang]}</p>
        </div>

        <div class="section-block">
          <div class="section-label">📊 ${isKo ? '6대 평가 기준 매트릭스' : 'Evaluation Criteria Matrix'}</div>
          <div class="table-wrapper">
            <table class="eval-table">
              <thead>
                <tr>
                  <th>${isKo ? '평가 항목' : 'Criterion'}</th>
                  <th style="width: 100px; text-align: center;">${isKo ? '결과' : 'Status'}</th>
                  <th>${isKo ? '상세 결과 및 관찰 내용' : 'Observed Details'}</th>
                </tr>
              </thead>
              <tbody>
    `

    for (const ev of lab.evaluations) {
      const criterionName = CRITERIA_MAP[ev.id][lang]
      const evStatusClass = ev.status === 'pass' ? 'badge-pass' : ev.status === 'fail' ? 'badge-fail' : 'badge-na'
      const evStatusText = ev.status === 'pass' ? 'PASS' : ev.status === 'fail' ? 'FAIL' : 'N/A'
      bodyHTML += `
        <tr>
          <td class="cell-criterion">${criterionName}</td>
          <td style="text-align: center;"><span class="eval-badge ${evStatusClass}">${evStatusText}</span></td>
          <td class="cell-comment">${ev.comment[lang]}</td>
        </tr>
      `
    }

    bodyHTML += `
              </tbody>
            </table>
          </div>
        </div>

        <div class="section-block">
          <div class="section-label">💡 ${isKo ? '핵심 발견점 (Key Finding)' : 'Key Finding'}</div>
          <p class="finding-text">${lab.keyFinding[lang]}</p>
        </div>

        <div class="section-block">
          <div class="section-label">➡️ ${isKo ? '다음 설계 결정 (Next Decision)' : 'Next Decision'}</div>
          <p class="decision-text">${lab.nextDecision[lang]}</p>
        </div>
      </section>
    `
  }

  bodyHTML += `</main>`

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #141418;
      --border: #27272f;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --primary: #3b82f6;
      --success: #22c55e;
      --danger: #ef4444;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.6;
      padding-bottom: 60px;
    }
    .header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(9, 9, 11, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .header-inner {
      max-width: 960px;
      margin: 0 auto;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-title { font-weight: 700; font-size: 15px; letter-spacing: -0.01em; }
    .brand-badge {
      font-size: 10px;
      font-weight: 800;
      background: #27272f;
      color: #60a5fa;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .header-actions { display: flex; gap: 10px; align-items: center; }
    .btn-lang {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 13px;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      transition: all 0.15s;
    }
    .btn-lang:hover { color: #fff; border-color: #52525b; }
    .btn-primary {
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .btn-primary:hover { background: #1d4ed8; }
    .container { max-width: 960px; margin: 0 auto; padding: 30px 20px; }
    .hero { margin-bottom: 32px; }
    .hero h1 { font-size: 26px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.02em; }
    .subtitle { color: var(--text-muted); font-size: 15px; line-height: 1.6; }
    .toc-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 40px;
    }
    .toc-card h2 { font-size: 17px; font-weight: 700; margin-bottom: 16px; }
    .toc-grid { display: flex; flex-direction: column; gap: 20px; }
    .toc-phase h3 { font-size: 14px; font-weight: 600; color: #60a5fa; margin-bottom: 10px; }
    .toc-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px; }
    .toc-item {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: #d4d4d8;
      font-size: 13px;
      padding: 6px 10px;
      border-radius: 8px;
      background: rgba(255,255,255,0.02);
      border: 1px solid transparent;
      transition: all 0.15s;
    }
    .toc-item:hover { background: rgba(255,255,255,0.06); border-color: var(--border); color: #fff; }
    .phase-divider {
      margin: 50px 0 24px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
    }
    .phase-divider h2 { font-size: 20px; font-weight: 700; color: #93c5fd; }
    .lab-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 28px;
      scroll-margin-top: 80px;
    }
    .lab-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 18px;
    }
    .lab-title-group { display: flex; flex-direction: column; gap: 8px; }
    .lab-title-group h3 { font-size: 18px; font-weight: 700; color: #fff; }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
      letter-spacing: 0.04em;
    }
    .status-winner { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid #22c55e; }
    .status-progress { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid #3b82f6; }
    .status-failed { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid #ef4444; }
    .sandbox-btn {
      background: #272730;
      color: #f4f4f5;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid #3f3f4e;
      white-space: nowrap;
      transition: all 0.15s;
    }
    .sandbox-btn:hover { background: #3f3f4e; color: #fff; }
    .section-block { margin-top: 16px; }
    .section-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .hypothesis-text {
      background: #191920;
      border-left: 3px solid #3b82f6;
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      font-size: 14px;
      color: #e4e4e7;
    }
    .finding-text { font-size: 14px; color: #d4d4d8; line-height: 1.6; }
    .decision-text { font-size: 14px; color: #93c5fd; line-height: 1.6; font-weight: 500; }
    .table-wrapper { overflow-x: auto; margin-top: 6px; }
    .eval-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    .eval-table th {
      background: #1a1a22;
      color: var(--text-muted);
      padding: 8px 12px;
      border: 1px solid var(--border);
      font-weight: 600;
    }
    .eval-table td {
      padding: 8px 12px;
      border: 1px solid var(--border);
      color: #d4d4d8;
    }
    .cell-criterion { font-weight: 600; color: #f4f4f5; }
    .eval-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 9999px;
    }
    .badge-pass { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid #22c55e; }
    .badge-fail { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid #ef4444; }
    .badge-na { background: rgba(113, 113, 122, 0.15); color: #a1a1aa; border: 1px solid #52525b; }
  </style>
</head>
<body>
  ${bodyHTML}
</body>
</html>`
}

// Generate Markdown files
const enMarkdown = generateMarkdown('en')
const koMarkdown = generateMarkdown('ko')
fs.writeFileSync(path.join(rootDir, 'docs/LABS.md'), enMarkdown, 'utf8')
fs.writeFileSync(path.join(rootDir, 'docs/LABS.ko.md'), koMarkdown, 'utf8')

// Generate Static HTML files for Cloudflare Pages
const enHTML = generateHTML('en')
const koHTML = generateHTML('ko')
fs.writeFileSync(path.join(rootDir, 'apps/showcase/public/labs.html'), enHTML, 'utf8')
fs.writeFileSync(path.join(rootDir, 'apps/showcase/public/labs.ko.html'), koHTML, 'utf8')

console.log('✓ Successfully generated docs/LABS.md, docs/LABS.ko.md, and apps/showcase/public/labs.html!')
