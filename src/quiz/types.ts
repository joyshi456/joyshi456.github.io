/** One vocabulary item: the word as written, plus a romanisation when the
 *  language isn't already in Latin script. */
export interface Word {
  /** the word in its own script */
  native: string
  /** romanisation — omitted for languages already written in Latin */
  roman?: string
}

export interface Language {
  /** ISO 639-1 code, used as a stable key */
  code: string
  /** English name, e.g. "Georgian" */
  name: string
  /** endonym, e.g. "ქართული" */
  nativeName: string
  /** top-level family, e.g. "Kartvelian" */
  family: string
  /** branch within the family, e.g. "Indo-Aryan" */
  branch: string
  /** writing system, e.g. "Devanagari" */
  script: string
  /** true for right-to-left scripts (Arabic, Hebrew, Perso-Arabic) */
  rtl?: boolean
  /** the language's word bank, keyed by concept id — a superset of the ten
   *  the test currently uses, so `concepts` can be retuned without touching this */
  words: Record<string, Word>
}

/** One of the ten meanings the test asks about. */
export interface Concept {
  /** key into a language's `words` */
  id: string
  /** English meaning as shown to the player */
  label: string
  /** rough frequency band, 1 (core) to 5 (rare) — a hand-made estimate */
  level: number
  /** why this word is interesting; shown in the answer key */
  note: string
}

export interface Level {
  level: number
  label: string
}

export interface QuizData {
  /** the ten meanings used by every test, laddered from common to rare */
  concepts: Concept[]
  /** display names for the frequency bands */
  levels: Level[]
  /** every language the tests can draw on, keyed by `code` */
  languages: Language[]
}

/** One themed test: a named selection of languages out of the pool. */
export interface QuizSet {
  /** slug, also the ?set= value */
  id: string
  title: string
  /** short line under the title on the picker */
  tagline: string
  blurb: string
  /** results are grouped by family, except in single-family sets */
  groupBy: 'family' | 'branch'
  /** language codes, in the order they appear in the pool */
  languages: string[]
}

/** concept id -> the concept id the player paired it with (their answer) */
export type Pairing = Record<string, string>

export interface RoundResult {
  code: string
  /** what the player assigned to each word, keyed by the word's true concept id */
  answers: Pairing
  score: number
}
