import { useState } from 'react'
import { BOARD_PASSWORD, checkAdminPasscode, saveAdminKey } from './config'

const KEY = 'enjoyshi-events-unlocked'

/** Soft password gate. Accepts the guest password (view) OR the admin passcode
 *  (view + admin mode). Remembers unlock in localStorage so it's asked once. */
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
  const [checking, setChecking] = useState(false)

  if (unlocked) return <>{children}</>

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = value.trim()
    // guest password → just view the board
    if (v.toLowerCase() === BOARD_PASSWORD.toLowerCase()) {
      try {
        localStorage.setItem(KEY, '1')
      } catch {
        /* private mode — unlock for this session only */
      }
      setUnlocked(true)
      return
    }
    // otherwise it might be the admin passcode → view + admin mode
    setChecking(true)
    setErr(false)
    const isAdmin = await checkAdminPasscode(v)
    setChecking(false)
    if (isAdmin) {
      saveAdminKey(v)
      try {
        localStorage.setItem(KEY, '1')
      } catch {
        /* ignore */
      }
      window.location.reload() // reload so admin mode activates
      return
    }
    setErr(true)
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
          <button className="ink-btn" type="submit" disabled={checking}>
            {checking ? 'checking…' : 'enter →'}
          </button>
        </form>
        {err && <p className="gate-err">hmm, that's not it — try again ☕</p>}
      </div>
    </div>
  )
}
