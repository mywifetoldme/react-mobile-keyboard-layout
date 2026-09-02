/**
 * Distinguishes virtual software keyboard inputs (which resize visualViewport)
 * from native OS modal pickers (UIDatePicker, UIPickerView, file dialogs, etc.).
 *
 * Native pickers are dismissed by iOS WebKit if preventScroll or programmatic
 * window.scrollTo is executed. Virtual keyboard text inputs require scroll lock and positioning.
 */
export const isKeyboardTextInput = (el: unknown): boolean => {
  if (!el || typeof el !== 'object' || !('tagName' in el)) return false
  const element = el as {
    tagName?: string
    isContentEditable?: boolean
    contentEditable?: string
    type?: string
    readOnly?: boolean
    disabled?: boolean
  }

  // Guard: Disabled or read-only inputs do not open software keyboards
  if (element.disabled === true || element.readOnly === true) {
    return false
  }

  const tagName = (element.tagName || '').toUpperCase()

  if (tagName === 'TEXTAREA' || element.isContentEditable === true || element.contentEditable === 'true') {
    return true
  }

  if (tagName === 'INPUT') {
    const type = (element.type || 'text').toLowerCase()
    return ['text', 'search', 'url', 'tel', 'email', 'password', 'number'].includes(type)
  }

  return false
}
