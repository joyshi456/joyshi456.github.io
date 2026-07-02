export interface EventItem {
  /** stable slug, used as the RSVP key and DOM id */
  id: string
  title: string
  /** ISO date-time, e.g. "2026-07-12T18:00:00" */
  date: string
  /** free-text display date/time (e.g. "July 10 · 4–7pm"); overrides `date` when shown */
  when?: string
  location: string
  /** short handwritten blurb shown on the flyer (used when there's no poster image) */
  blurb: string
  /** optional poster image OR pdf (under /public/events/posters/...). If present,
   *  the flyer shows the poster with `details` below it instead of the text layout. */
  image?: string
  /** editable lines printed under the poster — change these freely to update a flyer */
  details?: string[]
  /** paper accent / tape color, any CSS color. Optional. */
  accent?: string
  /** pushpin color: 'red' | 'blue' | 'yellow' | 'green' (defaults rotate) */
  pin?: string
}

export interface Attendee {
  /** row id, used for self-service removal */
  id?: number
  name: string
}

/** A decorative, non-clickable item pinned to the board (sticker, card, receipt…). */
export interface Decoration {
  id: string
  image: string
  /** alt text / caption */
  label?: string
  /** rotation in degrees */
  tilt?: number
  /** how it's stuck on: a wooden pin or a strip of tape */
  attach?: 'pin' | 'tape'
  /** placement on the board (center-anchored), as % of the stage */
  x?: number
  y?: number
  /** rendered width in px */
  w?: number
}

export interface RsvpInput {
  eventId: string
  /** event title, used only to personalize the confirmation text */
  eventTitle: string
  name: string
  phone: string
  /** show first name publicly on the board */
  showName: boolean
  /** explicit consent to receive texts */
  consent: boolean
}
