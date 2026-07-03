import { useState } from 'react'
import { IS_ADMIN, checkAdminPasscode, clearAdminKey, saveAdminKey } from './config'
import { LogsPanel } from './LogsPanel'

/** A discreet corner control: enter the admin passcode to unlock, or exit. */
export function AdminBar() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [err, setErr] = useState(false)
  const [checking, setChecking] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  if (IS_ADMIN) {
    return (
      <>
        <div className="admin-bar admin-bar--on">
          <span className="admin-tag">admin ✓</span>
          <button className="admin-pill-btn" onClick={() => setShowLogs(true)}>
            logs
          </button>
          <button
            className="admin-pill-btn"
            onClick={() => {
              clearAdminKey()
              window.location.reload()
            }}
          >
            exit
          </button>
        </div>
        {showLogs && <LogsPanel onClose={() => setShowLogs(false)} />}
      </>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    setErr(false)
    const ok = await checkAdminPasscode(value.trim())
    setChecking(false)
    if (ok) {
      saveAdminKey(value.trim())
      window.location.reload()
    } else {
      setErr(true)
    }
  }

  if (!open) {
    return (
      <button className="admin-bar" onClick={() => setOpen(true)}>
        admin
      </button>
    )
  }

  return (
    <form className={err ? 'admin-bar admin-bar--form admin-bar--err' : 'admin-bar admin-bar--form'} onSubmit={submit}>
      <input
        className="admin-input"
        type="password"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setErr(false)
        }}
        placeholder={err ? 'wrong passcode' : 'admin passcode'}
        autoFocus
        aria-label="admin passcode"
      />
      <button type="submit" className="admin-go" disabled={checking}>
        {checking ? '…' : 'go'}
      </button>
    </form>
  )
}
