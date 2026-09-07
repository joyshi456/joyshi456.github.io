import { useMemo, useState } from 'react'
import type { Concept, Language, Pairing } from './types'
import { shuffle } from './util'

interface RoundProps {
  language: Language
  concepts: Concept[]
  /** 1-based position in the run */
  index: number
  total: number
  showRoman: boolean
  onToggleRoman: () => void
  onDone: (answers: Pairing) => void
}

/**
 * One language's matching board: ten words on the left, the same ten English
 * meanings (shuffled) on the right. Click a word then its meaning — or the
 * other way round — to pair them; click either half again to undo.
 *
 * No feedback is given during the round; everything is revealed in the results.
 */
export function Round({
  language,
  concepts,
  index,
  total,
  showRoman,
  onToggleRoman,
  onDone,
}: RoundProps) {
  // Shuffled once per mount so the two columns never line up. The parent keys
  // this component by language code, so each round remounts with a fresh order.
  const wordOrder = useMemo(() => shuffle(concepts), [concepts])
  const meaningOrder = useMemo(() => shuffle(concepts), [concepts])
  const labelOf = useMemo(
    () => new Map(concepts.map((c) => [c.id, c.label])),
    [concepts],
  )

  /** true concept of the word -> meaning the player put against it */
  const [pairs, setPairs] = useState<Pairing>({})
  const [selWord, setSelWord] = useState<string | null>(null)
  const [selMeaning, setSelMeaning] = useState<string | null>(null)

  const usedMeanings = new Set(Object.values(pairs))
  const done = Object.keys(pairs).length === concepts.length

  function clearSelection() {
    setSelWord(null)
    setSelMeaning(null)
  }

  function pair(word: string, meaning: string) {
    setPairs((prev) => {
      const next: Pairing = {}
      // a meaning can only be used once — drop any earlier claim on it
      for (const [w, m] of Object.entries(prev)) {
        if (m !== meaning) next[w] = m
      }
      next[word] = meaning
      return next
    })
    clearSelection()
  }

  function unpairWord(word: string) {
    setPairs((prev) => {
      const next = { ...prev }
      delete next[word]
      return next
    })
    clearSelection()
  }

  function clickWord(word: string) {
    if (pairs[word]) return unpairWord(word)
    if (selMeaning) return pair(word, selMeaning)
    setSelWord((cur) => (cur === word ? null : word))
  }

  function clickMeaning(meaning: string) {
    const owner = Object.keys(pairs).find((w) => pairs[w] === meaning)
    if (owner) return unpairWord(owner)
    if (selWord) return pair(selWord, meaning)
    setSelMeaning((cur) => (cur === meaning ? null : meaning))
  }

  function submit() {
    onDone(pairs)
  }

  const madePairs = Object.keys(pairs).length

  return (
    <div className="round">
      {/* On desktop this column is sticky; on mobile `display: contents` frees
          the card and the action bar to sit above and below the board. */}
      <div className="side">
        <aside className="lang-card">
          <span className="round-count">
            {index} / {total}
          </span>
          <h2 className="lang-name">{language.name}</h2>
          <p className={`lang-endonym script-${language.code}`} dir={language.rtl ? 'rtl' : 'ltr'}>
            {language.nativeName}
          </p>
          {language.classical && <span className="classical-tag">classical</span>}

          <dl className="lang-facts">
            <div>
              <dt>Family</dt>
              <dd>{language.family}</dd>
            </div>
            <div>
              <dt>Branch</dt>
              <dd>{language.branch}</dd>
            </div>
            <div>
              <dt>Script</dt>
              <dd>
                {language.script}
                {language.rtl ? ' · right-to-left' : ''}
              </dd>
            </div>
          </dl>

          <label className="roman-toggle">
            <input type="checkbox" checked={showRoman} onChange={onToggleRoman} />
            Show romanisation
          </label>
        </aside>

        <div className="action-bar">
          <div className="progress">
            <div className="progress-bar" style={{ width: `${(madePairs / concepts.length) * 100}%` }} />
          </div>
          <p className="progress-label">
            {madePairs} of {concepts.length} paired
          </p>
          <button className="next-btn" disabled={!done} onClick={submit}>
            {index === total ? 'See results' : 'Next language'}
          </button>
        </div>
      </div>

      <div className="board">
        <p className="hint">
          Pair each word with its meaning. You&rsquo;re not expected to know these languages —
          guessing from words that look familiar is the whole point.
        </p>

        <div className="columns">
          <ul className="col words">
            {wordOrder.map((concept) => {
              const w = language.words[concept.id]
              const answer = pairs[concept.id]
              const roman = showRoman ? w.roman : undefined
              return (
                <li key={concept.id}>
                  <button
                    className={`chip word ${selWord === concept.id ? 'sel' : ''} ${answer ? 'paired' : ''}`}
                    onClick={() => clickWord(concept.id)}
                  >
                    <span className={`native script-${language.code}`} dir={language.rtl ? 'rtl' : 'ltr'}>
                      {w.native}
                    </span>
                    {roman && <span className="roman">{roman}</span>}
                    {answer && <span className="answer">{labelOf.get(answer)}</span>}
                  </button>
                </li>
              )
            })}
          </ul>

          <ul className="col meanings">
            {meaningOrder.map((meaning) => (
              <li key={meaning.id}>
                <button
                  className={`chip meaning ${selMeaning === meaning.id ? 'sel' : ''} ${
                    usedMeanings.has(meaning.id) ? 'used' : ''
                  }`}
                  onClick={() => clickMeaning(meaning.id)}
                >
                  {meaning.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
