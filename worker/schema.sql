-- enjoyshi events RSVP store (Cloudflare D1 / SQLite)
CREATE TABLE IF NOT EXISTS rsvps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  phone      TEXT    NOT NULL,
  show_name  INTEGER NOT NULL DEFAULT 0,  -- 1 = show first name publicly
  consent    INTEGER NOT NULL DEFAULT 0,  -- 1 = agreed to receive texts
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  texted_at  TEXT                          -- when they were texted (NULL = not yet)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps (event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_phone ON rsvps (event_id, phone);

-- audit trail: every add / remove, kept even after the rsvp row is deleted
CREATE TABLE IF NOT EXISTS rsvp_log (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  action   TEXT    NOT NULL,          -- 'add' | 'remove'
  source   TEXT,                      -- 'signup' | 'self' | 'admin'
  event_id TEXT,
  name     TEXT,
  phone    TEXT,
  at       TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rsvp_log_at ON rsvp_log (at);
