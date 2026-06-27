import type { Attendee, RsvpInput } from './types'

/**
 * Base URL of the Cloudflare Worker that handles RSVPs + Twilio SMS.
 * Leave empty ('') to run the board in DEMO mode: submissions are kept in
 * memory only (no texts sent), so you can develop the UI before the backend
 * is deployed. Once the worker is live, set this to e.g.
 *   https://enjoyshi-events.<your-subdomain>.workers.dev
 */
export const API_BASE = ''

/**
 * Password to view the board. Change this to whatever you like.
 * NOTE: this is a *soft* lock — the site is static, so the check runs in the
 * browser and a determined visitor could read it from the page source. It's
 * meant to keep the casual public out and share with friends, not to protect
 * secrets. (For a real lock we'd gate content through the Cloudflare Worker.)
 */
export const BOARD_PASSWORD = 'teahouse'

export const DEMO_MODE = API_BASE.trim() === ''

/** Submit an RSVP. Returns nothing on success, throws on failure. */
export async function submitRsvp(input: RsvpInput): Promise<void> {
  if (DEMO_MODE) {
    // Pretend-success so the UI flow is testable without a backend.
    await new Promise((r) => setTimeout(r, 600))
    return
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
}

/** Fetch the publicly-visible (opted-in) attendee names for an event. */
export async function fetchAttendees(eventId: string): Promise<Attendee[]> {
  if (DEMO_MODE) return []
  const res = await fetch(`${API_BASE}/rsvp?event=${encodeURIComponent(eventId)}`)
  if (!res.ok) return []
  const data = (await res.json()) as { attendees?: Attendee[] }
  return data.attendees ?? []
}
