import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Decoration as Deco, EventItem } from './types'
import { Flyer } from './Flyer'
import { FlyerDialog } from './FlyerDialog'
import { Decoration } from './Decoration'
import eventsData from './events.json'
import decorationsData from './decorations.json'

const EVENTS = eventsData as EventItem[]
const DECORATIONS = decorationsData as Deco[]

export function Corkboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = EVENTS.find((e) => e.id === selectedId) ?? null

  // close on Escape
  function onOverlayKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setSelectedId(null)
  }

  return (
    <div className="board-frame">
      <div className="board">
        <div className="board-stage">
          <div className="stage-poster">
            {EVENTS.map((event) => (
              <Flyer key={event.id} event={event} onOpen={() => setSelectedId(event.id)} />
            ))}
          </div>
          {DECORATIONS.map((deco) => (
            <Decoration key={deco.id} deco={deco} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
            onKeyDown={onOverlayKey}
            tabIndex={-1}
          >
            <FlyerDialog event={selected} onClose={() => setSelectedId(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
