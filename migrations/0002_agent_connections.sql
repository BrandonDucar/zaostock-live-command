CREATE TABLE IF NOT EXISTS agent_connections (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  runtime TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONNECTED',
  connected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_connections_event_status
  ON agent_connections(event_id, status);

