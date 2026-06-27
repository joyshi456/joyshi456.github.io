import { format, parseISO } from 'date-fns'

export function formatWhen(iso: string): string {
  try {
    return format(parseISO(iso), "EEE, MMM d · h:mmaaa")
  } catch {
    return iso
  }
}

// --- deterministic per-flyer variety ---------------------------------------

function hash(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** seeded LCG → deterministic pseudo-random stream in [0,1) */
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

export interface PinSpec {
  xPct: number
  size: number
  tilt: number
}

export interface Variant {
  /** paper rotation, deg */
  tilt: number
  /** paper color */
  tone: string
  /** taller / shorter sheet, px */
  minH: number
  /** colored poster header band behind the title */
  banner: boolean
  /** tear-off fringe at the bottom */
  tabs: boolean
  pins: PinSpec[]
}

const TONES = ['#fffdf4', '#fdf8ec', '#f9f6ee', '#fffaf0', '#f3f0e4', '#fefdfb', '#fbf7f0']

const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)]
const span = (r: () => number, lo: number, hi: number) => lo + r() * (hi - lo)

export function variantFor(id: string): Variant {
  const r = rng(hash(id))
  const tilt = span(r, -3.5, 3.5)
  const tone = pick(r, TONES)
  const minH = Math.round(span(r, 250, 430))
  const banner = r() > 0.5
  const tabs = r() > 0.45

  // mostly a single pin near the top; sometimes two upper corners
  const twoPins = r() > 0.62
  const pins: PinSpec[] = twoPins
    ? [
        { xPct: span(r, 14, 22), size: Math.round(span(r, 26, 30)), tilt: span(r, -28, 28) },
        { xPct: span(r, 78, 86), size: Math.round(span(r, 26, 30)), tilt: span(r, -28, 28) },
      ]
    : [{ xPct: span(r, 42, 58), size: Math.round(span(r, 30, 36)), tilt: span(r, -25, 25) }]

  return { tilt, tone, minH, banner, tabs, pins }
}
