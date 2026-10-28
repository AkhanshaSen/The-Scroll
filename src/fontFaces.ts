/** Handwriting @font-face rules with Vite base path (GitHub Pages uses /The-Scroll/). */
const base = import.meta.env.BASE_URL

const FACES: ReadonlyArray<readonly [family: string, file: string]> = [
  ['Rock Salt', 'rock-salt-latin.woff2'],
  ['Patrick Hand', 'patrick-hand-latin.woff2'],
  ['Great Vibes', 'great-vibes-latin.woff2'],
  ['Caveat', 'caveat-latin.woff2'],
  ['Homemade Apple', 'homemade-apple-latin.woff2'],
  ['Indie Flower', 'indie-flower-latin.woff2'],
  ['Kalam', 'kalam-latin.woff2'],
  ['Allura', 'allura-latin.woff2'],
  ['Shadows Into Light', 'shadows-into-light-latin.woff2'],
  ['Permanent Marker', 'permanent-marker-latin.woff2'],
  ['Sacramento', 'sacramento-latin.woff2'],
]

const css = FACES.map(
  ([family, file]) =>
    `@font-face{font-family:"${family}";src:url("${base}fonts/${file}") format("woff2");font-weight:400;font-style:normal;font-display:swap;}`,
).join('')

const style = document.createElement('style')
style.setAttribute('data-font-faces', 'paper-scroll')
style.textContent = css
document.head.prepend(style)
