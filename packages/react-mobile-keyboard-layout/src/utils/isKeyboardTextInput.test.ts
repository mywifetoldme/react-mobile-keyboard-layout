import { describe, it, expect } from 'vitest'
import { isKeyboardTextInput } from './isKeyboardTextInput'

describe('isKeyboardTextInput helper', () => {
  it('returns true for virtual keyboard text inputs', () => {
    const textInput = document.createElement('input')
    textInput.type = 'text'
    expect(isKeyboardTextInput(textInput)).toBe(true)

    const searchInput = document.createElement('input')
    searchInput.type = 'search'
    expect(isKeyboardTextInput(searchInput)).toBe(true)

    const emailInput = document.createElement('input')
    emailInput.type = 'email'
    expect(isKeyboardTextInput(emailInput)).toBe(true)

    const passwordInput = document.createElement('input')
    passwordInput.type = 'password'
    expect(isKeyboardTextInput(passwordInput)).toBe(true)

    const numberInput = document.createElement('input')
    numberInput.type = 'number'
    expect(isKeyboardTextInput(numberInput)).toBe(true)

    const textarea = document.createElement('textarea')
    expect(isKeyboardTextInput(textarea)).toBe(true)

    const contentEditable = document.createElement('div')
    contentEditable.contentEditable = 'true'
    expect(isKeyboardTextInput(contentEditable)).toBe(true)
  })

  it('returns false for native OS pickers and button inputs', () => {
    const dateInput = document.createElement('input')
    dateInput.type = 'date'
    expect(isKeyboardTextInput(dateInput)).toBe(false)

    const timeInput = document.createElement('input')
    timeInput.type = 'time'
    expect(isKeyboardTextInput(timeInput)).toBe(false)

    const select = document.createElement('select')
    expect(isKeyboardTextInput(select)).toBe(false)

    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    expect(isKeyboardTextInput(fileInput)).toBe(false)

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    expect(isKeyboardTextInput(checkbox)).toBe(false)

    const button = document.createElement('button')
    expect(isKeyboardTextInput(button)).toBe(false)

    const plainDiv = document.createElement('div')
    expect(isKeyboardTextInput(plainDiv)).toBe(false)

    expect(isKeyboardTextInput(null)).toBe(false)
    expect(isKeyboardTextInput(undefined)).toBe(false)
  })
})
