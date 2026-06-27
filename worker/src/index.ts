/**
 * enjoyshi events — RSVP worker
 * --------------------------------
 * POST /rsvp           store an RSVP in D1 + send a Twilio confirmation text
 * GET  /rsvp?event=ID  return the opted-in first names for that event
 *
 * Secrets (set with `wrangler secret put <NAME>`):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM         your Twilio number in E.164, e.g. +14155551234
 * Binding (wrangler.toml):
 *   DB                  a D1 database
 */

export interface Env {
  DB: D1Database
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_FROM: string
  /** secret key gating the private /admin/rsvps export (name + phone) */
  ADMIN_KEY: string
}

interface RsvpBody {
  eventId?: string
  eventTitle?: string
  name?: string
  phone?: string
  showName?: boolean
  consent?: boolean
}

const ALLOWED_ORIGINS = [
  'https://enjoyshi.com',
  'https://www.enjoyshi.com',
  'http://localhost:5180',
  'http://localhost:5173',
]

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    Vary: 'Origin',
  }
}

function json(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders(origin) },
  })
}

/** Best-effort E.164 normalization, US-default. Returns null if implausible. */
function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '')
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? ''

/** strip newlines/control chars so the event title can't break the SMS body */
const sanitizeTitle = (t: string) => t.replace(/[\r\n]+/g, ' ').trim().slice(0, 80)

async function sendSms(env: Env, to: string, body: string): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`
  const form = new URLSearchParams({ To: to, From: env.TWILIO_FROM, Body: body })
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Twilio ${res.status}: ${detail}`)
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin')
    const url = new URL(req.url)

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    // --- private admin export: full name + phone list ---------------------
    // GET /admin/rsvps?key=ADMIN_KEY[&event=ID][&format=csv]
    if (url.pathname === '/admin/rsvps' && req.method === 'GET') {
      const key =
        url.searchParams.get('key') ??
        (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
      if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
        return json({ error: 'unauthorized' }, 401, origin)
      }
      const eventId = url.searchParams.get('event')
      const stmt = eventId
        ? env.DB.prepare(
            'SELECT event_id, name, phone, show_name, consent, created_at FROM rsvps WHERE event_id = ? ORDER BY created_at ASC',
          ).bind(eventId)
        : env.DB.prepare(
            'SELECT event_id, name, phone, show_name, consent, created_at FROM rsvps ORDER BY created_at ASC',
          )
      const { results } = await stmt.all<{
        event_id: string
        name: string
        phone: string
        show_name: number
        consent: number
        created_at: string
      }>()
      const rows = results ?? []

      if (url.searchParams.get('format') === 'csv') {
        const esc = (s: unknown) => `"${String(s).replace(/"/g, '""')}"`
        const lines = ['name,phone,event,show_name,consent,signed_up_at']
        for (const r of rows) {
          lines.push(
            [esc(r.name), esc(r.phone), esc(r.event_id), r.show_name, r.consent, esc(r.created_at)].join(','),
          )
        }
        return new Response(lines.join('\n'), {
          status: 200,
          headers: { 'content-type': 'text/csv; charset=utf-8', ...corsHeaders(origin) },
        })
      }

      return json(
        {
          count: rows.length,
          signups: rows.map((r) => ({
            name: r.name,
            phone: r.phone,
            event: r.event_id,
            showName: r.show_name === 1,
            consent: r.consent === 1,
            at: r.created_at,
          })),
        },
        200,
        origin,
      )
    }

    if (url.pathname !== '/rsvp') {
      return json({ error: 'not found' }, 404, origin)
    }

    // --- public list of opted-in names -----------------------------------
    if (req.method === 'GET') {
      const eventId = url.searchParams.get('event')
      if (!eventId) return json({ error: 'missing event' }, 400, origin)
      const { results } = await env.DB.prepare(
        'SELECT name FROM rsvps WHERE event_id = ? AND show_name = 1 ORDER BY created_at ASC',
      )
        .bind(eventId)
        .all<{ name: string }>()
      const attendees = (results ?? []).map((r) => ({ name: firstName(r.name) }))
      return json({ attendees }, 200, origin)
    }

    // --- create an RSVP ---------------------------------------------------
    if (req.method === 'POST') {
      let body: RsvpBody
      try {
        body = (await req.json()) as RsvpBody
      } catch {
        return json({ error: 'invalid JSON' }, 400, origin)
      }

      const eventId = (body.eventId ?? '').trim()
      const name = (body.name ?? '').trim()
      const showName = body.showName === true
      const consent = body.consent === true

      if (!eventId || name.length < 2) return json({ error: 'missing name or event' }, 400, origin)
      if (!consent) return json({ error: 'consent required to receive texts' }, 400, origin)

      const phone = normalizePhone(body.phone ?? '')
      if (!phone) return json({ error: 'please enter a valid phone number' }, 400, origin)

      // de-dupe: has this number already signed up for this event?
      const existing = await env.DB.prepare(
        'SELECT id FROM rsvps WHERE event_id = ? AND phone = ? LIMIT 1',
      )
        .bind(eventId, phone)
        .first<{ id: number }>()

      await env.DB.prepare(
        'INSERT INTO rsvps (event_id, name, phone, show_name, consent) VALUES (?, ?, ?, ?, ?)',
      )
        .bind(eventId, name, phone, showName ? 1 : 0, consent ? 1 : 0)
        .run()

      // Send a confirmation text only if Twilio is fully configured AND this
      // is the first sign-up for this number+event. Until Twilio is set up,
      // we just store the RSVP (Joy texts people herself from the export).
      const twilioReady = !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM)
      let smsSent = false
      if (!existing && twilioReady) {
        const title = sanitizeTitle(body.eventTitle ?? 'the event')
        const msg = `You're on the list for ${title}! We'll text you the details. Reply STOP to opt out.`
        try {
          await sendSms(env, phone, msg)
          smsSent = true
        } catch (err) {
          // RSVP is saved; surface SMS failure but don't lose the sign-up
          console.error('SMS failed:', err)
        }
      }

      return json({ ok: true, smsSent }, 200, origin)
    }

    return json({ error: 'method not allowed' }, 405, origin)
  },
}
