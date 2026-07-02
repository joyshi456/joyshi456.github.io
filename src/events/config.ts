import type { Attendee, RsvpInput } from './types'

/**
 * Base URL of the Cloudflare Worker that handles RSVPs + Twilio SMS.
 * Leave empty ('') to run the board in DEMO mode: submissions are kept in
 * memory only (no texts sent), so you can develop the UI before the backend
 * is deployed. Once the worker is live, set this to e.g.
 *   https://enjoyshi-events.<your-subdomain>.workers.dev
 */
export const API_BASE = 'https://enjoyshi-events.joyshi456.workers.dev'

/**
 * Password to view the board. Change this to whatever you like.
 * NOTE: this is a *soft* lock — the site is static, so the check runs in the
 * browser and a determined visitor could read it from the page source. It's
 * meant to keep the casual public out and share with friends, not to protect
 * secrets. (For a real lock we'd gate content through the Cloudflare Worker.)
 */
export const BOARD_PASSWORD = 'teahouse'

export const DEMO_MODE = API_BASE.trim() === ''

/**
 * Admin mode: open the board with ?admin=<ADMIN_KEY> to reveal delete (✕)
 * controls next to each sign-up. The key must match the worker's ADMIN_KEY;
 * without it, deletes are rejected server-side, so normal visitors can't remove
 * registrations even if they poke around.
 */
export const ADMIN_KEY =
  typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('admin') ?? '')
    : ''
export const IS_ADMIN = ADMIN_KEY.length > 0

export interface AdminSignup {
  id: number
  name: string
  phone: string
  showName: boolean
}

/** Submit an RSVP. Returns whether a confirmation text was sent; throws on failure. */
export async function submitRsvp(input: RsvpInput): Promise<{ smsSent: boolean }> {
  if (DEMO_MODE) {
    // Pretend-success so the UI flow is testable without a backend.
    await new Promise((r) => setTimeout(r, 600))
    return { smsSent: false }
  }
  const res = await fetch(`${API_BASE}/rsvp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Request failed (${res.status})`)
  }
  const data = (await res.json().catch(() => ({}))) as { smsSent?: boolean }
  return { smsSent: data.smsSent === true }
}

/** Fetch the publicly-visible (opted-in) attendee names for an event. */
export async function fetchAttendees(eventId: string): Promise<Attendee[]> {
  if (DEMO_MODE) return []
  const res = await fetch(`${API_BASE}/rsvp?event=${encodeURIComponent(eventId)}`)
  if (!res.ok) return []
  const data = (await res.json()) as { attendees?: Attendee[] }
  return data.attendees ?? []
}

export interface EventMeta {
  title?: string
  when?: string
  location?: string
}

/** Public: fetch admin-edited overrides (title / when / location) for an event. */
export async function fetchEventMeta(eventId: string): Promise<EventMeta> {
  if (DEMO_MODE) return {}
  const res = await fetch(`${API_BASE}/event?event=${encodeURIComponent(eventId)}`)
  if (!res.ok) return {}
  const data = (await res.json()) as EventMeta
  const out: EventMeta = {}
  if (data.title) out.title = data.title
  if (data.when) out.when = data.when
  if (data.location) out.location = data.location
  return out
}

/** Admin: save an event's title / when / location. */
export async function saveEventMeta(eventId: string, meta: EventMeta): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/event?key=${encodeURIComponent(ADMIN_KEY)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ eventId, ...meta }),
  })
  if (!res.ok) throw new Error(`Save failed (${res.status})`)
}

/** Public self-service: remove a publicly-listed sign-up by id. */
export async function removeRsvp(id: number): Promise<void> {
  if (DEMO_MODE) return
  const res = await fetch(`${API_BASE}/rsvp/delete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error(`Remove failed (${res.status})`)
}

/** Admin: fetch ALL sign-ups (with ids + phones) for an event. */
export async function fetchAdminSignups(eventId: string): Promise<AdminSignup[]> {
  if (!IS_ADMIN || DEMO_MODE) return []
  const res = await fetch(
    `${API_BASE}/admin/rsvps?event=${encodeURIComponent(eventId)}&key=${encodeURIComponent(ADMIN_KEY)}`,
  )
  if (!res.ok) return []
  const data = (await res.json()) as {
    signups?: { id: number; name: string; phone: string; showName: boolean }[]
  }
  return (data.signups ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    showName: s.showName,
  }))
}

/** Admin: delete a single registration by id. */
export async function deleteRsvp(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/delete?key=${encodeURIComponent(ADMIN_KEY)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error(`Delete failed (${res.status})`)
}
