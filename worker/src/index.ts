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

/** Append an entry to the add/remove audit log. Never throws into the main flow. */
async function logAction(
  env: Env,
  action: 'add' | 'remove',
  source: string,
  eventId: string,
  name: string,
  phone: string,
): Promise<void> {
  try {
    await env.DB.prepare(
      'INSERT INTO rsvp_log (action, source, event_id, name, phone) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(action, source, eventId, name, phone)
      .run()
  } catch {
    /* logging must never break a sign-up or removal */
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin')
    const url = new URL(req.url)

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    const adminKey = () =>
      url.searchParams.get('key') ??
      (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
    const adminOk = () => !!env.ADMIN_KEY && adminKey() === env.ADMIN_KEY

    // --- reset the texted flag so everyone counts as "new" again ----------
    // GET /admin/reset-texted?key=ADMIN_KEY[&event=ID]
    if (url.pathname === '/admin/reset-texted' && req.method === 'GET') {
      if (!adminOk()) return json({ error: 'unauthorized' }, 401, origin)
      const eventId = url.searchParams.get('event')
      const r = eventId
        ? await env.DB.prepare('UPDATE rsvps SET texted_at = NULL WHERE event_id = ?').bind(eventId).run()
        : await env.DB.prepare('UPDATE rsvps SET texted_at = NULL').run()
      return json({ reset: true, event: eventId ?? 'all', changed: r.meta?.changes ?? 0 }, 200, origin)
    }

    // --- delete a single registration -------------------------------------
    // POST /admin/delete?key=ADMIN_KEY   body: { id: number }
    if (url.pathname === '/admin/delete' && req.method === 'POST') {
      if (!adminOk()) return json({ error: 'unauthorized' }, 401, origin)
      let body: { id?: number }
      try {
        body = (await req.json()) as { id?: number }
      } catch {
        return json({ error: 'invalid JSON' }, 400, origin)
      }
      const id = Number(body.id)
      if (!Number.isFinite(id)) return json({ error: 'missing id' }, 400, origin)
      const row = await env.DB.prepare('SELECT event_id, name, phone FROM rsvps WHERE id = ?')
        .bind(id)
        .first<{ event_id: string; name: string; phone: string }>()
      const r = await env.DB.prepare('DELETE FROM rsvps WHERE id = ?').bind(id).run()
      if (row && (r.meta?.changes ?? 0) > 0) {
        await logAction(env, 'remove', 'admin', row.event_id, row.name, row.phone)
      }
      return json({ deleted: r.meta?.changes ?? 0 }, 200, origin)
    }

    // --- admin: the add/remove audit log ----------------------------------
    // GET /admin/log?key=ADMIN_KEY[&event=ID][&format=csv]
    if (url.pathname === '/admin/log' && req.method === 'GET') {
      if (!adminOk()) return json({ error: 'unauthorized' }, 401, origin)
      const eventId = url.searchParams.get('event')
      const { results } = await (eventId
        ? env.DB.prepare(
            'SELECT action, source, event_id, name, phone, at FROM rsvp_log WHERE event_id = ? ORDER BY at DESC',
          ).bind(eventId)
        : env.DB.prepare(
            'SELECT action, source, event_id, name, phone, at FROM rsvp_log ORDER BY at DESC',
          )
      ).all<{ action: string; source: string; event_id: string; name: string; phone: string; at: string }>()
      const rows = results ?? []
      if (url.searchParams.get('format') === 'csv') {
        const esc = (s: unknown) => `"${String(s ?? '').replace(/"/g, '""')}"`
        const lines = ['action,source,name,phone,event,at']
        for (const r of rows) {
          lines.push([r.action, esc(r.source), esc(r.name), esc(r.phone), esc(r.event_id), esc(r.at)].join(','))
        }
        return new Response(lines.join('\n'), {
          status: 200,
          headers: { 'content-type': 'text/csv; charset=utf-8', ...corsHeaders(origin) },
        })
      }
      return json({ count: rows.length, log: rows }, 200, origin)
    }

    // --- private admin export: full name + phone list ---------------------
    // GET /admin/rsvps?key=ADMIN_KEY[&event=ID][&format=csv][&new=1]
    //   new=1  -> only people not yet texted; marks them texted on the way out
    if (url.pathname === '/admin/rsvps' && req.method === 'GET') {
      if (!adminOk()) return json({ error: 'unauthorized' }, 401, origin)
      const eventId = url.searchParams.get('event')
      const onlyNew = url.searchParams.get('new') === '1'

      const where: string[] = []
      const binds: unknown[] = []
      if (eventId) {
        where.push('event_id = ?')
        binds.push(eventId)
      }
      if (onlyNew) where.push('texted_at IS NULL')
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

      const { results } = await env.DB.prepare(
        `SELECT id, event_id, name, phone, show_name, consent, created_at FROM rsvps ${whereSql} ORDER BY created_at ASC`,
      )
        .bind(...binds)
        .all<{
          id: number
          event_id: string
          name: string
          phone: string
          show_name: number
          consent: number
          created_at: string
        }>()
      const rows = results ?? []

      // claim: mark the people we're handing out as texted so the next run skips them
      if (onlyNew && rows.length) {
        const ids = rows.map((r) => r.id)
        const placeholders = ids.map(() => '?').join(',')
        await env.DB.prepare(`UPDATE rsvps SET texted_at = datetime('now') WHERE id IN (${placeholders})`)
          .bind(...ids)
          .run()
      }

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
            id: r.id,
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

    // --- public: read admin-edited event overrides -----------------------
    // GET /event?event=ID  ->  { title?, when?, location? }
    if (url.pathname === '/event' && req.method === 'GET') {
      const eventId = url.searchParams.get('event')
      if (!eventId) return json({}, 200, origin)
      const row = await env.DB.prepare(
        'SELECT title, when_text, location FROM event_meta WHERE event_id = ?',
      )
        .bind(eventId)
        .first<{ title: string | null; when_text: string | null; location: string | null }>()
      return json(
        row
          ? { title: row.title ?? undefined, when: row.when_text ?? undefined, location: row.location ?? undefined }
          : {},
        200,
        origin,
      )
    }

    // --- admin: edit an event's title / when / location -------------------
    // POST /admin/event?key=ADMIN_KEY   body: { eventId, title, when, location }
    if (url.pathname === '/admin/event' && req.method === 'POST') {
      if (!adminOk()) return json({ error: 'unauthorized' }, 401, origin)
      let body: { eventId?: string; title?: string; when?: string; location?: string }
      try {
        body = (await req.json()) as typeof body
      } catch {
        return json({ error: 'invalid JSON' }, 400, origin)
      }
      const eventId = (body.eventId ?? '').trim()
      if (!eventId) return json({ error: 'missing eventId' }, 400, origin)
      const title = (body.title ?? '').trim() || null
      const when = (body.when ?? '').trim() || null
      const location = (body.location ?? '').trim() || null
      await env.DB.prepare(
        `INSERT INTO event_meta (event_id, title, when_text, location, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(event_id) DO UPDATE SET
           title = excluded.title,
           when_text = excluded.when_text,
           location = excluded.location,
           updated_at = excluded.updated_at`,
      )
        .bind(eventId, title, when, location)
        .run()
      return json({ ok: true, title, when, location }, 200, origin)
    }

    // --- public self-service removal -------------------------------------
    // POST /rsvp/delete   body: { id }
    // Only removes publicly-listed (show_name=1) rows, so anonymous sign-ups
    // can't be enumerated and wiped by guessing ids.
    if (url.pathname === '/rsvp/delete' && req.method === 'POST') {
      let body: { id?: number }
      try {
        body = (await req.json()) as { id?: number }
      } catch {
        return json({ error: 'invalid JSON' }, 400, origin)
      }
      const id = Number(body.id)
      if (!Number.isFinite(id)) return json({ error: 'missing id' }, 400, origin)
      const row = await env.DB.prepare(
        'SELECT event_id, name, phone FROM rsvps WHERE id = ? AND show_name = 1',
      )
        .bind(id)
        .first<{ event_id: string; name: string; phone: string }>()
      if (!row) return json({ deleted: 0 }, 200, origin)
      await env.DB.prepare('DELETE FROM rsvps WHERE id = ?').bind(id).run()
      await logAction(env, 'remove', 'self', row.event_id, row.name, row.phone)
      return json({ deleted: 1 }, 200, origin)
    }

    if (url.pathname !== '/rsvp') {
      return json({ error: 'not found' }, 404, origin)
    }

    // --- public list of opted-in names -----------------------------------
    if (req.method === 'GET') {
      const eventId = url.searchParams.get('event')
      if (!eventId) return json({ error: 'missing event' }, 400, origin)
      const { results } = await env.DB.prepare(
        'SELECT id, name FROM rsvps WHERE event_id = ? AND show_name = 1 ORDER BY created_at ASC',
      )
        .bind(eventId)
        .all<{ id: number; name: string }>()
      const attendees = (results ?? []).map((r) => ({ id: r.id, name: firstName(r.name) }))
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
      await logAction(env, 'add', 'signup', eventId, name, phone)

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
