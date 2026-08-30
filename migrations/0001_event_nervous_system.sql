CREATE TABLE IF NOT EXISTS event_state (
  event_id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  at_minute INTEGER NOT NULL,
  source TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  proof_class TEXT NOT NULL,
  mode TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_events_event_time
  ON event_events(event_id, created_at DESC);

