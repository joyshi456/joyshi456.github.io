import { useState } from 'react'
import { BOARD_PASSWORD } from './config'

const KEY = 'enjoyshi-events-unlocked'

/** Soft password gate. Remembers unlock in localStorage so it's asked once. */
export function Gate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })
  const [value, setValue] = useState('')
  const [err, setErr] = useState(false)

  if (unlocked) return <>{children}</>

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim().toLowerCase() === BOARD_PASSWORD.toLowerCase()) {
      try {
        localStorage.setItem(KEY, '1')
      } catch {
        /* private mode — just unlock for this session */
      }
      setUnlocked(true)
    } else {
      setErr(true)
    }
  }

  return (
    <div className="board-frame gate-frame">
      <div className="gate-card">
        <span className="gate-pin" aria-hidden />
        <h1 className="gate-title">joy's events</h1>
        <p className="gate-sub">enter password</p>
        <form className={err ? 'gate-form gate-form--err' : 'gate-form'} onSubmit={submit}>
          <input
            className="ink-input gate-input"
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setErr(false)
            }}
            placeholder="password"
            autoFocus
            aria-label="password"
          />
          <button className="ink-btn" type="submit">
            enter →
          </button>
        </form>
        {err && <p className="gate-err">hmm, that's not it — try again ☕</p>}
      </div>
    </div>
  )
}
