import {
  FALLBACK_SEEDS,
  FAMILIES,
  FIXED_VERSE,
  HAIKU_IMAGES,
  LIMERICKS,
  MOOD_WORDS,
  NOTES,
  PATTERNS,
  SEEDED_VERSE,
  type Family,
  type Mood,
  type Pattern,
  type Phase,
} from './lexicon.ts'
import { hashString, mulberry32, pick, shuffle, type Rng } from './rng.ts'
import { countText } from './syllables.ts'
import type { FormId } from '../types.ts'

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'my', 'me',
  'i', 'is', 'it', 'that', 'this', 'was', 'be', 'at', 'from', 'by', 'as', 'if', 'so',
  'but', 'not', 'just', 'very', 'really', 'um', 'uh', 'its', 'when', 'while', 'then',
  'than', 'into', 'over', 'after', 'before', 'about', 'your', 'you', 'we', 'our',
  'they', 'them', 'he', 'she', 'his', 'her', 'their', 'had', 'have', 'has', 'were',
  'are', 'been', 'would', 'could', 'should', 'did', 'do', 'does', 'because', 'up',
  'out', 'all', 'can', 'will', 'what', 'how', 'who', 'which', 'there', 'here',
])

export type Piece = {
  text: string
  align: 'left' | 'center'
}

type SchemeLine = { family: number; phase: Phase }

const SONNET: SchemeLine[] = [
  { family: 0, phase: 'open' },
  { family: 1, phase: 'open' },
  { family: 0, phase: 'open' },
  { family: 1, phase: 'open' },
  { family: 2, phase: 'deep' },
  { family: 3, phase: 'deep' },
  { family: 2, phase: 'deep' },
  { family: 3, phase: 'deep' },
  { family: 4, phase: 'turn' },
  { family: 5, phase: 'turn' },
  { family: 4, phase: 'turn' },
  { family: 5, phase: 'turn' },
  { family: 6, phase: 'close' },
  { family: 6, phase: 'close' },
]

const COUPLETS: SchemeLine[] = [
  { family: 0, phase: 'open' },
  { family: 0, phase: 'open' },
  { family: 1, phase: 'deep' },
  { family: 1, phase: 'deep' },
  { family: 2, phase: 'turn' },
  { family: 2, phase: 'turn' },
  { family: 3, phase: 'close' },
  { family: 3, phase: 'close' },
]

export function generatePiece(form: FormId, words: string, salt: number): Piece | null {
  if (form === 'blank') return null
  const rng = mulberry32(hashString(`${form}|${words}|${salt}`) ^ 0x9e3779b9)
  const found = collectSeeds(words, form === 'note' ? 12 : 8)
  const mood = detectMood(found)
  const seeds = found.length ? found : FALLBACK_SEEDS[mood]

  if (form === 'sonnet') {
    return { text: verse(SONNET, seeds, mood, rng), align: 'center' }
  }
  if (form === 'couplets') {
    return { text: verse(COUPLETS, seeds, mood, rng), align: 'center' }
  }
  if (form === 'haiku') {
    return { text: haiku(seeds, mood, rng), align: 'center' }
  }
  if (form === 'limerick') {
    return { text: pick(LIMERICKS, rng)(padSeeds(seeds, 2, mood)), align: 'center' }
  }
  if (form === 'freeverse') {
    return { text: freeVerse(seeds, rng), align: 'left' }
  }
  return { text: note(seeds, mood, words, rng), align: 'left' }
}

function collectSeeds(input: string, limit: number): string[] {
  const tokens = (input.toLowerCase().match(/[a-z][a-z']*/g) ?? []).map((word) =>
    word.replace(/^'+|'+$/g, ''),
  )
  const content = tokens.filter((word) => !STOP.has(word) && word.length > 1)
  const base = content.length ? content : tokens
  const seen = new Set<string>()
  const seeds: string[] = []
  for (const word of base) {
    const clean = word === 'i' ? 'I' : word
    if (seen.has(clean)) continue
    seen.add(clean)
    seeds.push(clean)
    if (seeds.length >= limit) break
  }
  return seeds
}

function detectMood(seeds: string[]): Mood {
  let best: Mood = 'plain'
  let score = 0
  for (const mood of ['wistful', 'bright', 'wild', 'tender'] as const) {
    const hits = seeds.reduce(
      (count, seed) => count + (MOOD_WORDS[mood].some((word) => seed.includes(word)) ? 1 : 0),
      0,
    )
    if (hits > score) {
      score = hits
      best = mood
    }
  }
  return best
}

function padSeeds(seeds: string[], count: number, mood: Mood): string[] {
  const pool = seeds.length ? seeds : FALLBACK_SEEDS[mood]
  return Array.from({ length: count }, (_, index) => pool[index % pool.length]!)
}

function verse(scheme: SchemeLine[], seeds: string[], mood: Mood, rng: Rng): string {
  const families = pickFamilies(Math.max(...scheme.map((line) => line.family)) + 1, mood, rng)
  const usedWords = new Set<string>()
  const usedPatterns = new Set<string>()
  const seeded = seedPlan(scheme.length, seeds.length)
  let cursor = 0
  const lines = scheme.map((step, index) => {
    const useSeed = seeded[index] ?? false
    const seed = seeds[cursor % seeds.length] ?? 'evening'
    if (useSeed) cursor += 1
    const line = chooseLine(families[step.family]!, step.phase, seed, useSeed, usedWords, usedPatterns, rng)
    if (index === scheme.length - 1 && !/[.!?]$/.test(line)) return `${line}.`
    return line
  })
  return lines.join('\n')
}

function seedPlan(lineCount: number, seedCount: number): boolean[] {
  const flags = Array<boolean>(lineCount).fill(false)
  if (seedCount <= 0) return flags
  const places = Math.max(seedCount, Math.ceil(lineCount * 0.7))
  for (let slot = 0; slot < places; slot += 1) {
    const index = Math.round((slot * (lineCount - 1)) / Math.max(places - 1, 1))
    flags[index] = true
  }
  flags[0] = true
  return flags
}

function pickFamilies(count: number, mood: Mood, rng: Rng): Family[] {
  const preferred = FAMILIES.filter((family) => family.mood === mood)
  const rest = FAMILIES.filter((family) => family.mood !== mood)
  const ordered = [...shuffle(preferred, rng), ...shuffle(rest, rng)]
  return ordered.slice(0, count)
}

function chooseLine(
  family: Family,
  phase: Phase,
  seed: string,
  useSeed: boolean,
  usedWords: Set<string>,
  usedPatterns: Set<string>,
  rng: Rng,
): string {
  const pool = patternPool(phase, useSeed, usedPatterns)
  const first = bestLine(pool, family, seed, useSeed, usedWords, rng, false)
  const chosen = first ?? bestLine(pool, family, seed, useSeed, usedWords, rng, true)
  if (!chosen) {
    const word = family.words[0]?.text ?? 'night'
    usedWords.add(word)
    return finish(applyPattern({ phase, slot: 'noun', text: 'I keep {seed} beside the {end}' }, seed, word))
  }
  usedPatterns.add(chosen.pattern)
  usedWords.add(chosen.word)
  return finish(chosen.text)
}

function patternPool(phase: Phase, useSeed: boolean, usedPatterns: Set<string>): Pattern[] {
  const phasePatterns = PATTERNS.filter((pattern) => pattern.phase === phase)
  const seeded = phasePatterns.filter((pattern) => pattern.text.includes('{seed}') === useSeed)
  const base = seeded.length ? seeded : phasePatterns
  const fresh = base.filter((pattern) => !usedPatterns.has(pattern.text))
  return fresh.length ? fresh : base
}

function bestLine(
  pool: Pattern[],
  family: Family,
  seed: string,
  useSeed: boolean,
  usedWords: Set<string>,
  rng: Rng,
  allowReuse: boolean,
): { text: string; word: string; pattern: string } | null {
  let best: { text: string; word: string; pattern: string; score: number } | null = null
  for (const pattern of pool) {
    const matching = family.words.filter((word) => word.slot === pattern.slot)
    const fitting = matching.filter((word) => allowReuse || !usedWords.has(word.text))
    for (const word of fitting) {
      const text = applyPattern(pattern, useSeed ? seed : null, word.text)
      const score = Math.abs(10 - countText(text)) + rng() * 0.45
      if (!best || score < best.score) {
        best = { text, word: word.text, pattern: pattern.text, score }
      }
    }
  }
  return best
}

function applyPattern(pattern: Pattern, seed: string | null, end: string): string {
  let text = pattern.text
  text = seed ? text.replaceAll('{seed}', seed) : text.replaceAll('{seed}', '').replace(/\s{2,}/g, ' ')
  return text.replaceAll('{end}', end)
}

function finish(line: string): string {
  const cleaned = line.replace(/\s+/g, ' ').replace(/\s+([,.;!?])/g, '$1').trim()
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function haiku(seeds: string[], mood: Mood, rng: Rng): string {
  const images = shuffle([...HAIKU_IMAGES[mood], ...HAIKU_IMAGES.plain], rng)
  const used = new Set<string>()
  const lines = [5, 7, 5].map((target, index) => {
    const seed = seeds[index]
    const line = haikuLine(target, seed, images, used, rng)
    return line
  })
  return lines.join('\n')
}

function haikuLine(
  target: number,
  seed: string | undefined,
  images: string[],
  used: Set<string>,
  rng: Rng,
): string {
  const available = images.filter((image) => !used.has(image))
  const pool = available.length ? available : images
  if (seed && countText(seed) <= target) {
    const seedCount = countText(seed)
    if (seedCount === target) return seed
    if (seedCount < target) {
      const match = pool.find((image) => countText(image) === target - seedCount)
      if (match) {
        used.add(match)
        return rng() < 0.5 ? `${seed}, ${match}` : `${match}, ${seed}`
      }
      const pair = pairImages(pool, target - seedCount)
      if (pair) {
        used.add(pair[0])
        used.add(pair[1])
        return rng() < 0.5 ? `${seed} ${pair[0]} ${pair[1]}` : `${pair[0]} ${pair[1]} ${seed}`
      }
    }
  }
  const exact = pool.find((image) => countText(image) === target)
  if (exact) {
    used.add(exact)
    return exact
  }
  const pair = pairImages(pool, target)
  if (pair) {
    used.add(pair[0])
    used.add(pair[1])
    return `${pair[0]} ${pair[1]}`
  }
  return padLine(target)
}

function pairImages(images: string[], target: number): [string, string] | null {
  for (let i = 0; i < images.length; i += 1) {
    for (let j = 0; j < images.length; j += 1) {
      if (i === j) continue
      const left = images[i]!
      const right = images[j]!
      if (countText(left) + countText(right) === target) return [left, right]
    }
  }
  return null
}

function padLine(target: number): string {
  const bits = ['still', 'soft', 'pale', 'here', 'now', 'then', 'old', 'thin']
  const parts: string[] = []
  let index = 0
  while (countText(parts.join(' ')) < target && index < 16) {
    parts.push(bits[index % bits.length]!)
    index += 1
  }
  return parts.join(' ')
}

function freeVerse(seeds: string[], rng: Rng): string {
  const seeded = shuffle(SEEDED_VERSE, rng)
  const fixed = shuffle(FIXED_VERSE, rng)
  const lines: string[] = []
  for (let index = 0; index < 10; index += 1) {
    if (index % 2 === 0) {
      lines.push(seeded[index % seeded.length]!(seeds[Math.floor(index / 2) % seeds.length]!))
    } else {
      lines.push(fixed[index % fixed.length]!)
    }
  }
  const first = lines[0]!
  lines[0] = first.charAt(0).toUpperCase() + first.slice(1)
  return lines.join('\n')
}

function note(seeds: string[], mood: Mood, raw: string, rng: Rng): string {
  const pack = NOTES[mood]
  const open = pick(pack.open, rng)
  const mid = pick(pack.mid, rng)
  const close = pick(pack.close, rng)
  const trimmed = raw.trim().replace(/\s+/g, ' ')
  const wordCount = trimmed ? trimmed.split(' ').length : 0
  if (trimmed && wordCount > seeds.length) {
    return `${open}.\n\n${trimmed}\n\n${mid} ${close}`
  }
  return `${open}: ${seeds.join(', ')}.\n\n${mid} ${close}`
}
