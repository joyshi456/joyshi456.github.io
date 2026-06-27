import { motion } from 'framer-motion'
import type { Decoration as Deco } from './types'
import { Pin } from './Pin'

/** A decorative pinned item — not clickable, just a piece of the neighborhood. */
export function Decoration({ deco }: { deco: Deco }) {
  return (
    <div
      className="deco deco--placed"
      style={{ left: `${deco.x ?? 50}%`, top: `${deco.y ?? 50}%`, width: `${deco.w ?? 200}px` }}
    >
      <motion.div
        className="deco-inner"
        style={{ '--tilt': `${deco.tilt ?? 0}deg` } as React.CSSProperties}
        whileHover={{ scale: 1.06, rotate: 0, zIndex: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        {deco.attach === 'pin' ? (
          <Pin className="flyer-pin" size={26} tilt={-6} style={{ left: '50%' }} />
        ) : (
          <span className="deco-tape" aria-hidden />
        )}
        <img className="deco-img" src={deco.image} alt={deco.label ?? ''} loading="lazy" />
      </motion.div>
    </div>
  )
}
