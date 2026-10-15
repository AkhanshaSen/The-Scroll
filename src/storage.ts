import { createScroll } from './model.ts'
import { FONTS, FORMS, INKS, TEXTURES, type Scrap, type Scroll, type Stroke } from './types.ts'

const KEY = 'paper-scroll-studio-v1'

export function loadDesk(): Scroll[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return [createScroll()]
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [createScroll()]
    const scrolls = parsed.map(sanitize).filter((scroll): scroll is Scroll => scroll !== null)
    return scrolls.length ? scrolls : [createScroll()]
  } catch {
    return [createScroll()]
  }
}

export function saveDesk(scrolls: Scroll[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(scrolls))
  } catch {
    // The sheet still works for this visit if the browser refuses to store it.
  }
}

function sanitize(value: unknown): Scroll | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null
  const texture = oneOf(value.texture, TEXTURES.map((item) => item.id), 'cream')
  const font = oneOf(value.font, FONTS.map((item) => item.id), 'print')
  const ink = oneOf(value.ink, INKS.map((item) => item.id), 'ink')
  const form = oneOf(value.form, FORMS.map((item) => item.id), 'sonnet')
  return {
    id: value.id,
    title: typeof value.title === 'string' ? value.title : '',
    titleCustom: value.titleCustom === true,
    texture,
    font,
    ink,
    form,
    words: typeof value.words === 'string' ? value.words : '',
    salt: typeof value.salt === 'number' && Number.isFinite(value.salt) ? value.salt : 0,
    scraps: Array.isArray(value.scraps) ? value.scraps.map(sanitizeScrap).filter((item) => item !== null) : [],
    strokes: Array.isArray(value.strokes) ? value.strokes.map(sanitizeStroke).filter((item) => item !== null) : [],
    created: typeof value.created === 'number' ? value.created : Date.now(),
  }
}

function sanitizeScrap(value: unknown): Scrap | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null
  const align = value.align === 'center' ? 'center' : 'left'
  return {
    id: value.id,
    role: value.role === 'generated' ? 'generated' as const : value.role === 'blank' ? 'blank' as const : 'free' as const,
    text: typeof value.text === 'string' ? value.text : '',
    x: num(value.x, 8),
    y: num(value.y, 8),
    width: num(value.width, 70),
    size: num(value.size, 28),
    kind: value.kind === 'sticker' ? 'sticker' as const : 'text' as const,
    align,
  }
}

function sanitizeStroke(value: unknown): Stroke | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !Array.isArray(value.points)) return null
  const points = value.points.flatMap((point) => {
    if (!isRecord(point) || typeof point.x !== 'number' || typeof point.y !== 'number') return []
    return [{ x: point.x, y: point.y }]
  })
  if (points.length < 2) return null
  return {
    id: value.id,
    ink: oneOf(value.ink, INKS.map((item) => item.id), 'ink'),
    size: num(value.size, 2.3),
    points,
  }
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
