import { motion } from 'framer-motion'
import type { EventItem } from './types'
import { formatWhen, variantFor } from './util'
import { Pin } from './Pin'
import { Poster } from './Poster'

interface Props {
  event: EventItem
  onOpen: () => void
}

/** A flyer pinned to the board. Either a poster (image/pdf) + details, or a
 *  printed text sheet. Click to expand into the sign-up sheet. */
export function Flyer({ event, onOpen }: Props) {
  const v = variantFor(event.id)
  const accent = event.accent ?? '#b5532e'
  const hasPoster = !!event.image

  return (
    <motion.button
      layoutId={`flyer-${event.id}`}
      className="flyer"
      style={{ '--tilt': `${v.tilt}deg`, '--accent': accent } as React.CSSProperties}
      onClick={onOpen}
      whileHover={{ scale: 1.035, rotate: 0, zIndex: 30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      aria-label={`Open ${event.title} flyer`}
    >
      {v.pins.map((p, i) => (
        <Pin key={i} className="flyer-pin" size={p.size} tilt={p.tilt} style={{ left: `${p.xPct}%` }} />
      ))}

      {hasPoster ? (
        /* ---- poster flyer: image + editable details below --------------- */
        <motion.div layout="position" className="sheet sheet--poster">
          <div className="poster-wrap">
            <Poster src={event.image!} alt={event.title} />
            <div className="poster-details">
              {(event.details ?? []).map((line, i) => (
                <p key={i} className={i === 0 ? 'poster-line poster-line--lead' : 'poster-line'}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        /* ---- printed text sheet ----------------------------------------- */
        <motion.div
          layout="position"
          className="sheet"
          style={{ background: v.tone, minHeight: v.minH } as React.CSSProperties}
        >
          {v.banner ? (
            <div className="title-band">
              <h2 className="flyer-title flyer-title--band">{event.title}</h2>
            </div>
          ) : (
            <h2 className="flyer-title">{event.title}</h2>
          )}

          <div className="flyer-meta">
            <p className="flyer-when">{formatWhen(event.date)}</p>
            <p className="flyer-where">{event.location}</p>
          </div>

          <p className="flyer-blurb">{event.blurb}</p>

          <div className="flyer-foot">
            <span className="flyer-cta">tap to sign up ✎</span>
          </div>

          {v.tabs && (
            <div className="tear-tabs" aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="tab">
                  sign up ✆
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.button>
  )
}
