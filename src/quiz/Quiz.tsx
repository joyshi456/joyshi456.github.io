import { useState } from 'react'
import pool from './languages.json'
import setList from './sets.json'
import { Picker } from './Picker'
import { Round } from './Round'
import { Results } from './Results'
import type { Language, Pairing, QuizData, QuizSet, RoundResult } from './types'
import { shuffle } from './util'

const data = pool as QuizData
const sets = setList as QuizSet[]
const byCode = new Map(data.languages.map((l) => [l.code, l]))

type Stage = 'picking' | 'playing' | 'results'

/** ?set=east-asia deep-links straight into one test. */
function setFromUrl(): QuizSet | null {
  if (typeof window === 'undefined') return null
  const id = new URLSearchParams(window.location.search).get('set')
  return sets.find((s) => s.id === id) ?? null
}

function languagesFor(set: QuizSet): Language[] {
  return set.languages.map((c) => byCode.get(c)).filter((l): l is Language => !!l)
}

export function Quiz() {
  const initial = setFromUrl()
  const [set, setSet] = useState<QuizSet | null>(initial)
  const [stage, setStage] = useState<Stage>(initial ? 'playing' : 'picking')
  /** language order for this attempt — reshuffled every time a test starts */
  const [order, setOrder] = useState<Language[]>(() => (initial ? shuffle(languagesFor(initial)) : []))
  const [at, setAt] = useState(0)
  const [results, setResults] = useState<RoundResult[]>([])
  const [showRoman, setShowRoman] = useState(true)

  const current = order[at]

  function start(next: QuizSet) {
    setSet(next)
    setOrder(shuffle(languagesFor(next)))
    setResults([])
    setAt(0)
    setStage('playing')
    // keep the URL shareable without adding a history entry per round
    const url = new URL(window.location.href)
    url.searchParams.set('set', next.id)
    window.history.replaceState(null, '', url)
  }

  function finishRound(answers: Pairing) {
    const score = data.concepts.filter((c) => answers[c.id] === c.id).length
    setResults((prev) => [...prev, { code: current.code, answers, score }])
    if (at + 1 >= order.length) setStage('results')
    else setAt(at + 1)
  }

  function backToPicker() {
    setStage('picking')
    setResults([])
    setAt(0)
    const url = new URL(window.location.href)
    url.searchParams.delete('set')
    window.history.replaceState(null, '', url)
  }

  return (
    <main className="page">
      <header className="masthead">
        <a className="home" href="/">
          ← enjoyshi
        </a>
        <h1>Multilingual vocabulary</h1>
        {stage !== 'picking' && set && <span className="masthead-set">{set.title}</span>}
      </header>

      {stage === 'picking' && (
        <Picker sets={sets} byCode={byCode} concepts={data.concepts} onPick={start} />
      )}

      {stage === 'playing' && current && (
        <Round
          key={`${set?.id}-${current.code}`}
          language={current}
          concepts={data.concepts}
          index={at + 1}
          total={order.length}
          showRoman={showRoman}
          onToggleRoman={() => setShowRoman((v) => !v)}
          onDone={finishRound}
        />
      )}

      {stage === 'results' && set && (
        <Results
          set={set}
          languages={order}
          concepts={data.concepts}
          levels={data.levels}
          results={results}
          onReplay={() => start(set)}
          onPickAnother={backToPicker}
        />
      )}
    </main>
  )
}
