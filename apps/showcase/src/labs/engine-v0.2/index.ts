export {
  useMobileKeyboard,
  type UseMobileKeyboardOptions,
  type UseMobileKeyboardReturn,
} from './hooks/useMobileKeyboard'

export {
  LayoutEngine,
  type LayoutEngineOptions,
} from './core/layoutEngine'

export {
  createDefaultLayoutRules,
  calculatePreservedScrollTop,
  isTouchDevice,
  isTextInput,
  isInsideFloating,
  isInsideBody,
  isNoNextTextInput,
  isFloatingActive,
  isBodyActive,
  isKeyboardOpen,
  isKeyboardClosed,
  hasActiveTextInput,
} from './core/layoutRules'

export type {
  FocusTarget,
  LayoutState,
  AnchorSnapshot,
  LayoutRefs,
  EngineEventType,
  ConditionPredicate,
  LayoutContext,
  LayoutRule,
} from './core/layoutTypes'

// Backwards compatibility alias
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
