import type { Concept, Language, QuizSet } from './types'
import { plural } from './util'

interface PickerProps {
  sets: QuizSet[]
  /** pool lookup, so each card can describe itself from real data */
  byCode: Map<string, Language>
  concepts: Concept[]
  onPick: (set: QuizSet) => void
}

/** Landing screen: choose which of the themed tests to take. */
export function Picker({ sets, byCode, concepts, onPick }: PickerProps) {
  const perSet = concepts.length
  const ladder = [...concepts].sort((a, b) => a.level - b.level)

  return (
    <div className="picker">
      <p className="lede">
        Four vocabulary tests. Each one shows you the same ten meanings in one language at a time and
        asks you to pair them up &mdash; and those ten ladder from core vocabulary to words that are
        genuinely rare.
      </p>
      <p className="picker-note">
        You are <em>not</em> expected to know these languages. Words that look familiar are the point:
        related languages should feel easier, and common words are easier than rare ones because they
        are the ones that get borrowed and inherited. Anything not written in the Latin alphabet is
        shown in its own script with a romanisation underneath.
      </p>
      <ol className="ladder">
        {ladder.map((c) => (
          <li key={c.id}>
            <span className="ladder-band">{c.level}</span>
            {c.label.toLowerCase()}
          </li>
        ))}
      </ol>
      <p className="ladder-caveat">
        Bands 1 (core) to 5 (rare) are my own estimate, not a corpus measurement.
      </p>

      <ul className="set-list">
        {sets.map((set) => {
          const langs = set.languages.map((c) => byCode.get(c)).filter((l): l is Language => !!l)
          const families = new Set(langs.map((l) => l.family))
          const branches = new Set(langs.map((l) => l.branch))
          const scripts = new Set(langs.map((l) => l.script))
          // a single-family set is more interesting counted by branch
          const grouping =
            families.size === 1
              ? plural(branches.size, 'branch', 'branches')
              : plural(families.size, 'family', 'families')

          return (
            <li key={set.id}>
              <button className="set-card" onClick={() => onPick(set)}>
                <span className="set-tagline">{set.tagline}</span>
                <span className="set-title">{set.title}</span>
                <span className="set-blurb">{set.blurb}</span>
                <span className="set-stats">
                  {plural(langs.length, 'language')} · {grouping} · {plural(scripts.size, 'script')} ·{' '}
                  {langs.length * perSet} points
                </span>
                <span className="set-langs">{langs.map((l) => l.name).join(' · ')}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
