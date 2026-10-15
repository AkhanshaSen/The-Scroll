const EXCEPTIONS: Record<string, number> = {
  beautiful: 3,
  business: 2,
  create: 2,
  evening: 2,
  notebook: 2,
  outlives: 2,
  poem: 2,
  poems: 2,
  poetry: 3,
  something: 2,
}

/** A small English syllable guess. Consistent matters more than a dictionary. */
export function syllables(raw: string): number {
  let word = raw.toLowerCase().replace(/[^a-z]/g, '')
  if (!word) return 0
  if (EXCEPTIONS[word] != null) return EXCEPTIONS[word]
  if (word.length <= 3) return 1
  if (word.endsWith('ing') && word.length > 5) {
    return syllables(word.slice(0, -3)) + 1
  }

  word = word.replace(/qu/g, 'q')
  const groups = word.match(/[aeiouy]+/g)
  let count = groups ? groups.length : 1
  const beforeLast = word.at(-3) ?? ''

  if (word.endsWith('ed') && word.length > 3 && !/[tld]/.test(beforeLast)) {
    count -= 1
  } else if (/[^aeiouy]e$/.test(word) && !word.endsWith('le')) {
    count -= 1
  }

  if (/e[^aeiouy]y$/.test(word) && count > 1) count -= 1
  return Math.max(1, count)
}

export function countText(text: string): number {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? []
  return words.reduce((sum, word) => sum + syllables(word), 0)
}
