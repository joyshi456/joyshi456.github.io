import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Attendee, EventItem } from './types'
import { formatWhen } from './util'
import { Pin } from './Pin'
import { DEMO_MODE, fetchAttendees, submitRsvp } from './config'

interface Props {
  event: EventItem
  onClose: () => void
}

type Status = 'idle' | 'submitting' | 'done' | 'error'

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? ''

export function FlyerDialog({ event, onClose }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showName, setShowName] = useState(true)
  const [consent, setConsent] = useState(true)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [smsSent, setSmsSent] = useState(false)
  const [coming, setComing] = useState<Attendee[]>([])

  useEffect(() => {
    let live = true
    fetchAttendees(event.id).then((a) => live && setComing(a))
    return () => {
      live = false
    }
  }, [event.id])

  const phoneDigits = phone.replace(/\D/g, '')
  const canSubmit =
    name.trim().length > 1 && phoneDigits.length >= 10 && consent && status !== 'submitting'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('submitting')
    setError('')
    try {
      const result = await submitRsvp({
        eventId: event.id,
        eventTitle: event.title,
        name: name.trim(),
        phone: phone.trim(),
        showName,
        consent,
      })
      if (showName) setComing((c) => [...c, { name: firstName(name) }])
      setSmsSent(result.smsSent)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  // Build the ruled lines: filled signups, then the active write-in line, then blanks.
  const activeIndex = status === 'done' ? -1 : coming.length
  const totalLines = Math.max(8, coming.length + 3)
  const rows = Array.from({ length: totalLines }, (_, i) => i)

  return (
    <motion.div
      layoutId={`flyer-${event.id}`}
      className="flyer flyer--expanded signup-sheet"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={`Sign up for ${event.title}`}
    >
      <Pin className="flyer-pin" size={34} tilt={-8} style={{ left: '50%' }} />
      <button className="flyer-close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <motion.div layout="position" className="sheet-inner">
        <div className="sheet-masthead">
          <h2 className="flyer-title flyer-title--lg">{event.title}</h2>
          <p className="masthead-meta">
            {formatWhen(event.date)} · {event.location}
          </p>
        </div>

        <p className="sheet-instruction">
          {status === 'done' ? "you're on the sheet ↓" : 'add your name to a free line ↓'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="sign-grid">
            <div className="sign-row sign-row--head">
              <span className="col-num">#</span>
              <span className="col-name">name</span>
              <span className="col-phone">phone</span>
            </div>

            {rows.map((i) => {
              if (i < coming.length) {
                return (
                  <div className="sign-row" key={i}>
                    <span className="col-num">{i + 1}</span>
                    <span className="col-name sign-name">{coming[i].name}</span>
                    <span className="col-phone sign-name sign-name--muted">✓</span>
                  </div>
                )
              }
              if (i === activeIndex) {
                return (
                  <div className="sign-row sign-row--active" key={i}>
                    <span className="col-num">{i + 1}</span>
                    <span className="col-name">
                      <input
                        className="line-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="your name"
                        autoComplete="name"
                        aria-label="your name"
                      />
                    </span>
                    <span className="col-phone">
                      <input
                        className="line-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="phone"
                        inputMode="tel"
                        autoComplete="tel"
                        aria-label="your phone number"
                      />
                    </span>
                  </div>
                )
              }
              return (
                <div className="sign-row" key={i}>
                  <span className="col-num">{i + 1}</span>
                  <span className="col-name" />
                  <span className="col-phone" />
                </div>
              )
            })}
          </div>

          {status === 'done' ? (
            <div className="sheet-controls">
              <p className="done-note">
                {showName ? 'Added! ✿ ' : 'Added (kept private). '}
                {DEMO_MODE
                  ? 'Demo mode — no text sent.'
                  : smsSent
                    ? 'Check your phone for a confirmation text.'
                    : "You're on the list — we'll text you the details. ✿"}
              </p>
              <button type="button" className="ink-btn" onClick={onClose}>
                back to the board
              </button>
            </div>
          ) : (
            <div className="sheet-controls">
              <label className="ink-check">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>text me updates about this event</span>
              </label>
              <label className="ink-check">
                <input
                  type="checkbox"
                  checked={showName}
                  onChange={(e) => setShowName(e.target.checked)}
                />
                <span>show my name on the sheet (uncheck to stay anonymous)</span>
              </label>

              {status === 'error' && <p className="signup-err">{error}</p>}

              <button className="ink-btn" type="submit" disabled={!canSubmit}>
                {status === 'submitting' ? 'signing…' : 'add me →'}
              </button>
              <p className="fine-print">
                We only text you about this event. Reply STOP to opt out anytime.
              </p>
            </div>
          )}
        </form>
      </motion.div>
    </motion.div>
  )
}
