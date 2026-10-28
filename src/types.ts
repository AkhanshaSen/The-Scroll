export const TEXTURES = [
  { id: 'cream', label: 'Cream' },
  { id: 'parchment', label: 'Parchment' },
  { id: 'kraft', label: 'Kraft' },
  { id: 'rice', label: 'Rice' },
  { id: 'notebook', label: 'Notebook' },
  { id: 'rose', label: 'Rose' },
  { id: 'sage', label: 'Sage' },
  { id: 'indigo', label: 'Indigo' },
  { id: 'night', label: 'Night' },
  { id: 'crumpled', label: 'Crumpled' },
  { id: 'crusty', label: 'Crusty' },
  { id: 'leaf', label: 'Banana leaf' },
  { id: 'linen', label: 'Linen' },
  { id: 'washi', label: 'Washi' },
] as const

export const FONTS = [
  { id: 'scribble', label: 'Scribble', family: '"Rock Salt", cursive', scale: 0.7 },
  { id: 'school', label: 'School pen', family: '"Patrick Hand", cursive', scale: 1.12 },
  { id: 'cursive', label: 'Cursive', family: '"Great Vibes", cursive', scale: 1.38 },
  { id: 'print', label: 'Printed hand', family: '"Caveat", cursive', scale: 1.16 },
  { id: 'signature', label: 'Signature', family: '"Homemade Apple", cursive', scale: 0.78 },
  { id: 'casual', label: 'Casual', family: '"Indie Flower", cursive', scale: 1.05 },
  { id: 'marker', label: 'Marker', family: '"Kalam", cursive', scale: 1 },
  { id: 'formal', label: 'Formal script', family: '"Allura", cursive', scale: 1.45 },
  { id: 'light', label: 'Light scribble', family: '"Shadows Into Light", cursive', scale: 1.15 },
  { id: 'bold', label: 'Bold', family: '"Permanent Marker", cursive', scale: 0.82 },
  { id: 'thin', label: 'Thin signature', family: '"Sacramento", cursive', scale: 1.35 },
] as const

export const INKS = [
  { id: 'ink', label: 'Ink', color: '#2a2118' },
  { id: 'sepia', label: 'Sepia', color: '#6b3a28' },
  { id: 'blue', label: 'Blue', color: '#1d3d66' },
  { id: 'green', label: 'Green', color: '#1d4034' },
  { id: 'plum', label: 'Plum', color: '#5c2e4a' },
  { id: 'gold', label: 'Gold', color: '#8a6a1f' },
  { id: 'rose', label: 'Rose', color: '#9c3d4a' },
  { id: 'charcoal', label: 'Charcoal', color: '#2c2c2c' },
  { id: 'light', label: 'Light', color: '#f4ead8' },
] as const

export const STICKERS = ['♥', '☾', '★', '☂', '❧', '☕', '🐦', '🔑', '🕯', '✉', '✿', '☀', '☁', '✦'] as const

export const NIGHT_INKS = ['light', 'gold', 'rose'] as const

export const FORMS = [
  { id: 'sonnet', label: 'Sonnet', hint: 'Fourteen lines, a turn, then a closing pair.' },
  { id: 'haiku', label: 'Haiku', hint: 'Three small lines, counted five, seven, five.' },
  { id: 'couplets', label: 'Couplets', hint: 'Rhymed pairs, one thought to a couple.' },
  { id: 'limerick', label: 'Limerick', hint: 'A crooked little story.' },
  { id: 'freeverse', label: 'Free verse', hint: 'Lines that refuse a uniform.' },
  { id: 'note', label: 'Note', hint: 'Plain speech, for when it is not a poem.' },
  { id: 'blank', label: 'Blank', hint: 'Just the paper. What you type in Words shows up here.' },
] as const

export type TextureId = (typeof TEXTURES)[number]['id']
export type FontId = (typeof FONTS)[number]['id']
export type InkId = (typeof INKS)[number]['id']
export type FormId = (typeof FORMS)[number]['id']

export type Scrap = {
  id: string
  role: 'generated' | 'free' | 'blank'
  kind: 'text' | 'sticker'
  text: string
  x: number
  y: number
  width: number
  size: number
  align: 'left' | 'center'
}

export type Point = { x: number; y: number }

export type Stroke = {
  id: string
  ink: InkId
  size: number
  points: Point[]
}

export type Scroll = {
  id: string
  title: string
  titleCustom: boolean
  texture: TextureId
  font: FontId
  ink: InkId
  form: FormId
  words: string
  salt: number
  scraps: Scrap[]
  strokes: Stroke[]
  created: number
  updatedAt: number
}

export function fontOf(id: FontId) {
  return FONTS.find((font) => font.id === id) ?? FONTS[3]
}

export function inkOf(id: InkId) {
  return INKS.find((ink) => ink.id === id) ?? INKS[0]
}
