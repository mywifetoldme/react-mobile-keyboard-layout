import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup, screen, act } from '@testing-library/react'
import { LabSandbox } from '../components/LabSandbox'
import { LABS_DATA } from '../data/labsData'
import { EXP04B_SHELL } from './Exp04BSandbox'

/**
 * EXP-04-B renders the library's PageLayout from the frozen engine copy, so the mechanism is
 * tested where it lives (packages/.../PageLayout.test.tsx). What the lab owns -- and tests here --
 * is that it really runs on that copy, and that nothing in its own content depends on the mode.
 */

const lab = LABS_DATA.find((l) => l.id === 'exp04_b')!

beforeEach(() => {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
  Object.defineProperty(window, 'visualViewport', { value: new EventTarget(), configurable: true, writable: true })
  window.scrollTo = (() => {}) as typeof window.scrollTo
})
afterEach(() => {
  cleanup()
  document.getElementById('root')?.remove()
  document.documentElement.removeAttribute('style')
})

const renderLab = (lang: 'ko' | 'en' = 'ko') =>
  render(<LabSandbox lab={lab} lang={lang} onClose={() => {}} />, { container: document.getElementById('root')! })

describe('EXP-04-B runs on the frozen copy of the library layout', () => {
  it('renders the copy\'s PageLayout (rmkl-v10- prefix), not the live package', () => {
    renderLab()
    expect(document.querySelector('.rmkl-v10-page-root')).not.toBeNull()
    expect(document.querySelector('main.rmkl-v10-page-body')).not.toBeNull()
    expect(document.querySelector('.rmkl-page-root')).toBeNull()
    expect(document.documentElement.style.getPropertyValue('--rmkl-v10-page-lock-y')).not.toBe('')
  })

  it('keys its HUD to the copy\'s shell attribute, never to :focus', () => {
    renderLab()
    expect(EXP04B_SHELL).toBe('.rmkl-v10-page-root[data-rmkl-v10-shell]')
    expect(EXP04B_SHELL).not.toMatch(/:focus-within|date|time|select/)
    const css = [...document.querySelectorAll('style')].map((el) => el.textContent ?? '').join('\n')
    expect(css).not.toMatch(/:focus-within/)
  })

  it('renders both mode labels at all times and lets CSS pick one', () => {
    renderLab()
    const count = () => document.querySelectorAll('.rmkl-exp04b-only-4a, .rmkl-exp04b-only-4b').length
    const before = count()
    expect(before).toBeGreaterThan(0)
    act(() => {
      screen.getByPlaceholderText('메시지 입력 (터치 시 4A App-Shell 자동 전환)...').focus()
    })
    expect(count()).toBe(before)
  })

  it('speaks the UI language in the HUD', () => {
    renderLab('en')
    expect(document.querySelector('.rmkl-exp04b-hud')!.textContent).not.toMatch(/[가-힣]/)
  })

  it('lets the native date picker shrink to the card', () => {
    renderLab()
    const date = document.querySelector('input[type="date"]') as HTMLInputElement
    expect(date.style.minWidth).toMatch(/^0(px)?$/)
    expect(date.style.maxWidth).toBe('100%')
  })
})
