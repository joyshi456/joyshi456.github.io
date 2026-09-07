import { useState } from 'react'
import type { Concept, Language, Level, QuizSet, RoundResult } from './types'

interface ResultsProps {
  set: QuizSet
  languages: Language[]
  concepts: Concept[]
  levels: Level[]
  results: RoundResult[]
  onReplay: () => void
  onPickAnother: () => void
}

interface GroupRow {
  label: string
  score: number
  possible: number
  langs: { language: Language; result: RoundResult }[]
}

/**
 * Group the run's scores by family — or by branch, for a set that is all one
 * family (an Indo-European-only test learns nothing from a single bar).
 */
function groupByLineage(
  languages: Language[],
  results: RoundResult[],
  perRound: number,
  by: 'family' | 'branch',
): GroupRow[] {
  const rows = new Map<string, GroupRow>()
  for (const result of results) {
    const language = languages.find((l) => l.code === result.code)
    if (!language) continue
    const label = by === 'branch' ? language.branch : language.family
    const row = rows.get(label) ?? { label, score: 0, possible: 0, langs: [] }
    row.score += result.score
    row.possible += perRound
    row.langs.push({ language, result })
    rows.set(label, row)
  }
  return [...rows.values()].sort((a, b) => b.score / b.possible - a.score / a.possible)
}

/** Score by frequency band: did the common words carry you, or the rare ones? */
function scoreByLevel(concepts: Concept[], levels: Level[], results: RoundResult[]) {
  return levels
    .map(({ level, label }) => {
      const inBand = concepts.filter((c) => c.level === level)
      let score = 0
      for (const r of results) for (const c of inBand) if (r.answers[c.id] === c.id) score++
      return {
        level,
        label,
        score,
        possible: inBand.length * results.length,
        words: inBand.map((c) => c.label.toLowerCase()).join(', '),
      }
    })
    .filter((b) => b.possible > 0)
}

export function Results({
  set,
  languages,
  concepts,
  levels,
  results,
  onReplay,
  onPickAnother,
}: ResultsProps) {
  const [open, setOpen] = useState<string | null>(null)

  const total = results.reduce((sum, r) => sum + r.score, 0)
  const possible = results.length * concepts.length
  // ten words against ten meanings with no reuse -> one expected hit per round
  const chance = results.length
  const lineage = groupByLineage(languages, results, concepts.length, set.groupBy)
  const bands = scoreByLevel(concepts, levels, results)
  const best = [...results].sort((a, b) => b.score - a.score)[0]
  const bestLang = languages.find((l) => l.code === best?.code)

  return (
    <div className="results">
      <header className="results-head">
        <p className="eyebrow">{set.title}</p>
        <p className="big-score">
          {total}
          <span className="of">/ {possible}</span>
        </p>
        <p className="score-note">
          Random pairing would score about {chance}.
          {bestLang && (
            <>
              {' '}
              Your best language was <strong>{bestLang.name}</strong> at {best.score}/{concepts.length}.
            </>
          )}
        </p>
      </header>

      <section>
        <h2 className="section-title">By {set.groupBy}</h2>
        <ul className="family-list">
          {lineage.map((row) => (
            <li key={row.label}>
              <div className="family-head">
                <span className="family-name">{row.label}</span>
                <span className="family-score">
                  {row.score}/{row.possible}
                </span>
              </div>
              <div className="meter">
                <div className="meter-fill" style={{ width: `${(row.score / row.possible) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="section-title">By word frequency</h2>
        <p className="section-note">
          The ten meanings ladder from core vocabulary to genuinely rare. Common words are easier to
          guess because they are the ones that get borrowed, inherited, and half-remembered.
        </p>
        <ul className="family-list">
          {bands.map((band) => (
            <li key={band.level}>
              <div className="family-head">
                <span className="family-name">
                  {band.label}
                  <span className="band-words">{band.words}</span>
                </span>
                <span className="family-score">
                  {band.score}/{band.possible}
                </span>
              </div>
              <div className="meter">
                <div className="meter-fill" style={{ width: `${(band.score / band.possible) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="section-title">Answer key</h2>
        <p className="section-note">Tap a language to see every word, its romanisation, and what you chose.</p>
        <ul className="lang-list">
          {lineage.flatMap((row) =>
            row.langs.map(({ language, result }) => {
              const isOpen = open === language.code
              return (
                <li key={language.code} className={isOpen ? 'open' : ''}>
                  <button className="lang-row" onClick={() => setOpen(isOpen ? null : language.code)}>
                    <span className="lang-row-name">
                      {language.name}
                      <span className={`lang-row-endonym script-${language.code}`} dir={language.rtl ? 'rtl' : 'ltr'}>
                        {language.nativeName}
                      </span>
                    </span>
                    <span className="lang-row-meta">
                      {language.family} · {language.branch} · {language.script}
                    </span>
                    <span className="lang-row-score">
                      {result.score}/{concepts.length}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="key-scroll">
                      <table className="key-table">
                        <thead>
                          <tr>
                            <th>Word</th>
                            <th>Romanisation</th>
                            <th>Meaning</th>
                            <th>Band</th>
                            <th>You said</th>
                          </tr>
                        </thead>
                        <tbody>
                          {concepts.map((concept) => {
                            const word = language.words[concept.id]
                            const given = result.answers[concept.id]
                            const right = given === concept.id
                            const givenLabel = concepts.find((c) => c.id === given)?.label
                            return (
                              <tr key={concept.id} className={right ? 'right' : 'wrong'}>
                                <td
                                  className={`key-native script-${language.code}`}
                                  dir={language.rtl ? 'rtl' : 'ltr'}
                                >
                                  {word.native}
                                </td>
                                <td className="key-roman">{word.roman ?? '—'}</td>
                                <td>{concept.label}</td>
                                <td className="key-band">{concept.level}</td>
                                <td className="key-given">
                                  {givenLabel ?? '—'} {right ? '✓' : '✗'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              )
            }),
          )}
        </ul>
      </section>

      <section>
        <h2 className="section-title">Why these ten words</h2>
        <ul className="note-list">
          {concepts.map((concept) => (
            <li key={concept.id}>
              <span className="note-word">
                {concept.label}
                <span className="note-band">band {concept.level}</span>
              </span>
              <span className="note-text">{concept.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="results-actions">
        <button className="next-btn" onClick={onReplay}>
          Take this one again
        </button>
        <button className="next-btn ghost" onClick={onPickAnother}>
          Try another test
        </button>
      </div>
    </div>
  )
}
