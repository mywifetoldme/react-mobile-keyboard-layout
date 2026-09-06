export {
  useMobileKeyboard,
  KEYBOARD_HEIGHT_CSS_VAR,
  KEYBOARD_INSET_CSS_VAR,
  type UseMobileKeyboardOptions,
  type UseMobileKeyboardReturn,
} from './hooks/useMobileKeyboard'

/** Which kind of input holds the keyboard focus. Kept for backwards compatibility. */
export type ActiveInputType = 'none' | 'floating' | 'body'

export {
  SubpageLayout,
  type SubpageLayoutProps,
} from './components/SubpageLayout'

export {
  FloatingInput,
  type FloatingInputProps,
} from './components/FloatingInput'

export { isKeyboardTextInput } from './utils/isKeyboardTextInput'
