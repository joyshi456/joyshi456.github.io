# enjoyshi events — RSVP worker

Cloudflare Worker that backs the `/events` corkboard. It stores RSVPs in a D1
database and sends a confirmation text via Twilio.

```
POST /rsvp            { eventId, eventTitle, name, phone, showName, consent }  → { ok, smsSent }
GET  /rsvp?event=ID                                                            → { attendees: [{ name }] }
```

The front-end talks to it via `src/events/config.ts` → set `API_BASE` to the
deployed worker URL.

---

## One-time setup

You need (1) a **Cloudflare** account and (2) a **Twilio** account with an SMS-capable number.

```bash
cd worker
npm install
npx wrangler login                     # opens the browser to authorize Cloudflare
```

### 1. Create the database

```bash
npx wrangler d1 create enjoyshi-events
```

Copy the printed `database_id` into `wrangler.toml` (replace `REPLACE_WITH_YOUR_D1_DATABASE_ID`).

Create the table:

```bash
npm run db:init        # runs schema.sql against the remote D1
```

### 2. Add Twilio secrets

From the Twilio console: **Account SID**, **Auth Token**, and your **From** number (E.164, e.g. `+14155551234`).

```bash
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_FROM
```

### 3. Deploy

```bash
npm run deploy
```

Wrangler prints a URL like `https://enjoyshi-events.<your-subdomain>.workers.dev`.

### 4. Point the front-end at it

In `../src/events/config.ts`, set:

```ts
export const API_BASE = 'https://enjoyshi-events.<your-subdomain>.workers.dev'
```

Rebuild/redeploy the site (push to the `gh-pages` branch). Done — real RSVPs now
get stored and texted.

---

## Local development

```bash
npm run db:init:local   # seed a local D1
npm run dev             # wrangler dev, usually http://localhost:8787
```

Set `API_BASE = 'http://localhost:8787'` in `config.ts` while testing locally.
(Twilio calls still hit the real API and send real texts unless you stub them.)

## Notes

- CORS is locked to `enjoyshi.com` + localhost (see `ALLOWED_ORIGINS` in `src/index.ts`).
- A phone number is only texted once per event (re-submits are de-duped).
- `show_name = 1` is the only thing the public `GET` exposes — phone numbers are never returned.
- Twilio/carrier rules require explicit opt-in: the form's "text me updates"
  checkbox is required and the body includes "Reply STOP to opt out."
