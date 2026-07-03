import { useEffect, useState } from 'react'
import { fetchAdminLog, type LogEntry } from './config'

/** Admin-only modal showing the full add/remove history (includes anonymous). */
export function LogsPanel({ onClose }: { onClose: () => void }) {
  const [log, setLog] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    fetchAdminLog().then((l) => {
      if (!live) return
      setLog(l)
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [])

  const adds = log.filter((e) => e.action === 'add').length
  const removes = log.filter((e) => e.action === 'remove').length

  return (
    <div className="overlay" onClick={onClose}>
      <div className="logs-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="flyer-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 className="logs-title">activity log</h2>
        <p className="logs-sub">
          every sign-up &amp; removal — anonymous ones included · {adds} joined, {removes} removed
        </p>

        {loading ? (
          <p className="logs-empty">loading…</p>
        ) : log.length === 0 ? (
          <p className="logs-empty">nothing yet ☕</p>
        ) : (
          <ul className="logs-list">
            {log.map((e, i) => (
              <li key={i} className={`log-row log-row--${e.action}`}>
                <span className="log-act">{e.action === 'add' ? '＋ joined' : '－ removed'}</span>
                <span className="log-name">{e.name || '—'}</span>
                <span className="log-phone">{e.phone}</span>
                <span className="log-src">{e.source}</span>
                <span className="log-when">{e.at}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
