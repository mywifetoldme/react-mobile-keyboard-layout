import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { LabSandbox } from './LabSandbox'
import { labCode } from './labSections'
import { LABS_DATA } from '../data/labsData'

/**
 * Every lab must mount, show its own header, and unmount without throwing. The labs are records;
 * one that crashes on open is a record nobody can read.
 */

beforeEach(() => {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
  Object.defineProperty(window, 'visualViewport', { value: new EventTarget(), configurable: true, writable: true })
  window.scrollTo = (() => {}) as typeof window.scrollTo // jsdom has no layout; several labs call it on mount
})
afterEach(() => {
  cleanup()
  document.getElementById('root')?.remove()
  document.documentElement.removeAttribute('style')
  document.body.removeAttribute('style')
})

describe('every lab opens', () => {
  for (const lab of LABS_DATA) {
    it(`${lab.id} renders its header and unmounts cleanly`, () => {
      const { unmount } = render(<LabSandbox lab={lab} lang="en" onClose={() => {}} />, {
        container: document.getElementById('root')!,
      })
      expect(screen.getByText(labCode(lab))).toBeTruthy()
      expect(() => unmount()).not.toThrow()
    })
  }
})
