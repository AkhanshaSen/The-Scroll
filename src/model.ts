import { generatePiece } from './engine/generate.ts'
import { NIGHT_INKS, type InkId, type Scrap, type Scroll, type TextureId } from './types.ts'

export function uid(): string {
  return crypto.randomUUID()
}

export function createScroll(): Scroll {
  return {
    id: uid(),
    title: '',
    titleCustom: false,
    texture: 'cream',
    font: 'print',
    ink: 'ink',
    form: 'sonnet',
    words: '',
    salt: 0,
    scraps: [],
    strokes: [],
    created: Date.now(),
    updatedAt: Date.now(),
  }
}

export function displayTitle(scroll: Scroll): string {
  if (scroll.titleCustom && scroll.title.trim()) return scroll.title.trim()
  for (const scrap of scroll.scraps) {
    if (scrap.kind === 'sticker') continue
    const line = scrap.text.split('\n').map((part) => part.trim()).find(Boolean)
    if (line) return line.length > 42 ? `${line.slice(0, 41)}…` : line
  }
  return 'Untitled'
}

function nightInk(ink: InkId): boolean {
  return (NIGHT_INKS as readonly string[]).includes(ink)
}

export function withTexture(scroll: Scroll, texture: TextureId): Scroll {
  let ink = scroll.ink
  if (texture === 'night' && !nightInk(ink)) ink = 'light'
  if (texture !== 'night' && scroll.texture === 'night' && ink === 'light') ink = 'ink'
  return { ...scroll, texture, ink }
}

export function normalizeLook(scroll: Scroll): Scroll {
  if (scroll.texture === 'night' && !nightInk(scroll.ink)) return { ...scroll, ink: 'light' }
  return scroll
}

export function writeFromWords(scroll: Scroll): Scroll {
  const piece = generatePiece(scroll.form, scroll.words, scroll.salt + 1)
  if (!piece) return scroll
  const existing = scroll.scraps.find((scrap) => scrap.role === 'generated')
  const next: Scrap = {
    id: existing?.id ?? uid(),
    role: 'generated',
    kind: 'text',
    text: piece.text,
    x: existing?.x ?? 8,
    y: existing?.y ?? 7,
    width: existing?.width ?? 84,
    size: existing?.size ?? (scroll.form === 'note' ? 26 : 28),
    align: piece.align,
  }
  const scraps = existing
    ? scroll.scraps.map((scrap) => (scrap.id === existing.id ? next : scrap))
    : [next, ...scroll.scraps]
  return { ...scroll, scraps, salt: scroll.salt + 1 }
}

export function scatterLines(scroll: Scroll): Scroll {
  const poem = scroll.scraps.find((scrap) => scrap.role === 'generated')
  if (!poem) return scroll
  const lines = poem.text.split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return scroll
  const step = Math.min(7.2, 86 / lines.length)
  const scraps = lines.map((text, index) => ({
    id: uid(),
    role: 'free' as const,
    kind: 'text' as const,
    text,
    x: 8 + (index % 2) * 4,
    y: Math.min(4 + index * step, 88),
    width: 78,
    size: poem.size,
    align: 'left' as const,
  }))
  return {
    ...scroll,
    scraps: [...scroll.scraps.filter((scrap) => scrap.id !== poem.id), ...scraps],
  }
}

export function duplicateScroll(scroll: Scroll): Scroll {
  const now = Date.now()
  return {
    ...scroll,
    id: uid(),
    title: `${displayTitle(scroll)} copy`,
    titleCustom: true,
    created: now,
    updatedAt: now,
    scraps: scroll.scraps.map((scrap) => ({ ...scrap, id: uid() })),
    strokes: scroll.strokes.map((stroke) => ({
      ...stroke,
      id: uid(),
      points: stroke.points.map((point) => ({ ...point })),
    })),
  }
}

export function touchScroll(scroll: Scroll): Scroll {
  return { ...scroll, updatedAt: Date.now() }
}

export function ensureBlankScrap(scroll: Scroll, id = uid()): Scroll {
  if (scroll.form !== 'blank') return scroll
  const existing = scroll.scraps.find((scrap) => scrap.role === 'blank')
  if (existing) {
    if (existing.text === scroll.words) return scroll
    return {
      ...scroll,
      scraps: scroll.scraps.map((scrap) => (scrap.id === existing.id ? { ...scrap, text: scroll.words } : scrap)),
    }
  }
  const scrap: Scrap = {
    id,
    role: 'blank',
    kind: 'text',
    text: scroll.words,
    x: 10,
    y: 12,
    width: 80,
    size: 28,
    align: 'left',
  }
  return { ...scroll, scraps: [scrap, ...scroll.scraps] }
}

export function syncWordsToBlank(scroll: Scroll, words: string, id?: string): Scroll {
  return ensureBlankScrap({ ...scroll, form: 'blank', words }, id)
}

export function syncBlankScrapToWords(scroll: Scroll, scrapId: string, text: string): Scroll {
  const target = scroll.scraps.find((scrap) => scrap.id === scrapId)
  if (!target || target.role !== 'blank') return scroll
  return {
    ...scroll,
    words: text,
    scraps: scroll.scraps.map((scrap) => (scrap.id === scrapId ? { ...scrap, text } : scrap)),
  }
}

export function addScrap(scroll: Scroll, x: number, y: number, id: string): Scroll {
  const scrap: Scrap = {
    id,
    role: 'free',
    kind: 'text',
    text: '',
    x: clamp(x, 2, 68),
    y: clamp(y, 2, 78),
    width: 42,
    size: 28,
    align: 'left',
  }
  return { ...scroll, scraps: [...scroll.scraps, scrap] }
}

export function addSticker(scroll: Scroll, mark: string, id: string): Scroll {
  const count = scroll.scraps.length
  const scrap: Scrap = {
    id,
    role: 'free',
    kind: 'sticker',
    text: mark,
    x: clamp(14 + (count % 5) * 14, 4, 78),
    y: clamp(12 + (count % 4) * 12, 4, 70),
    width: 16,
    size: 52,
    align: 'center',
  }
  return { ...scroll, scraps: [...scroll.scraps, scrap] }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
