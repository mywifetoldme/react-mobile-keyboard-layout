// Lets tests import a stylesheet as text (`import css from './x.css?raw'`, a Vite/Vitest feature)
// so the selectors under test are read from the real file.
declare module '*.css?raw' {
  const css: string
  export default css
}
