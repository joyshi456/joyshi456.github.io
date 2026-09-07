/** Fisher–Yates, returning a new array (never mutates the input). */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Score a round: one point per word paired with its true meaning. */
export function scoreRound(answers: Record<string, string>): number {
  return Object.entries(answers).filter(([truth, given]) => truth === given).length
}

export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "1 language" / "3 languages"; pass `many` for irregular plurals. */
export function plural(n: number, word: string, many = `${word}s`): string {
  return `${n} ${n === 1 ? word : many}`
}
