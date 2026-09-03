import { describe, it, expect } from 'vitest'
import { isKeyboardTextInput } from './isKeyboardTextInput'

describe('isKeyboardTextInput helper', () => {
  describe('Virtual keyboard text inputs (should return true)', () => {
    it('returns true for textarea elements', () => {
      const textarea = document.createElement('textarea')
      expect(isKeyboardTextInput(textarea)).toBe(true)
    })

    it('returns true for contenteditable elements', () => {
      const divWithAttr = document.createElement('div')
      divWithAttr.contentEditable = 'true'
      expect(isKeyboardTextInput(divWithAttr)).toBe(true)

      const plainObj = { tagName: 'DIV', contentEditable: 'true' }
      expect(isKeyboardTextInput(plainObj)).toBe(true)

      const objWithIsContentEditable = { tagName: 'DIV', isContentEditable: true }
      expect(isKeyboardTextInput(objWithIsContentEditable)).toBe(true)
    })

    it('returns true for standard keyboard input types', () => {
      const validTypes = ['text', 'search', 'url', 'tel', 'email', 'password', 'number']
      for (const type of validTypes) {
        const input = document.createElement('input')
        input.type = type
        expect(isKeyboardTextInput(input)).toBe(true)

        // Case insensitivity check
        const upperInput = { tagName: 'INPUT', type: type.toUpperCase() }
        expect(isKeyboardTextInput(upperInput)).toBe(true)
      }
    })

    it('returns true when <input> has no type attribute or empty type (defaults to text)', () => {
      const inputWithoutType = document.createElement('input')
      inputWithoutType.removeAttribute('type')
      expect(isKeyboardTextInput(inputWithoutType)).toBe(true)

      const inputEmptyType = { tagName: 'INPUT', type: '' }
      expect(isKeyboardTextInput(inputEmptyType)).toBe(true)

      const inputNullType = { tagName: 'INPUT' }
      expect(isKeyboardTextInput(inputNullType)).toBe(true)
    })
  })

  describe('Non-keyboard pickers and elements (should return false)', () => {
    it('returns false for native OS modal pickers and non-text input types', () => {
      const nonKeyboardTypes = [
        'date',
        'time',
        'datetime-local',
        'month',
        'week',
        'color',
        'file',
        'checkbox',
        'radio',
        'submit',
        'button',
        'reset',
        'range',
        'image',
        'hidden',
      ]
      for (const type of nonKeyboardTypes) {
        const input = document.createElement('input')
        input.type = type
        expect(isKeyboardTextInput(input)).toBe(false)
      }
    })

    it('returns false for select, button, and non-editable HTML elements', () => {
      expect(isKeyboardTextInput(document.createElement('select'))).toBe(false)
      expect(isKeyboardTextInput(document.createElement('button'))).toBe(false)
      expect(isKeyboardTextInput(document.createElement('div'))).toBe(false)
      expect(isKeyboardTextInput(document.createElement('span'))).toBe(false)
      expect(isKeyboardTextInput(document.createElement('form'))).toBe(false)
    })

    it('returns false without throwing for primitives, null, and invalid non-element objects', () => {
      expect(isKeyboardTextInput(null)).toBe(false)
      expect(isKeyboardTextInput(undefined)).toBe(false)
      expect(isKeyboardTextInput('string')).toBe(false)
      expect(isKeyboardTextInput(123)).toBe(false)
      expect(isKeyboardTextInput(true)).toBe(false)
      expect(isKeyboardTextInput({})).toBe(false)
      expect(isKeyboardTextInput({ otherProp: 'value' })).toBe(false)
      expect(isKeyboardTextInput([])).toBe(false)
    })
  })
})
