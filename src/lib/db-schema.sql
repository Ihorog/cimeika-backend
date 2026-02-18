-- CIMEIKA Backend Database Schema (D1)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Agent states table
CREATE TABLE IF NOT EXISTS agent_states (
  agent_type TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Events table (inter-agent communication log)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  agent_from TEXT NOT NULL,
  agent_to TEXT NOT NULL,
  message_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  processed INTEGER NOT NULL DEFAULT 0,
  processed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  agent TEXT NOT NULL,
  data TEXT,
  timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Health checks table
CREATE TABLE IF NOT EXISTS health_checks (
  id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL,
  score REAL NOT NULL,
  message TEXT,
  details TEXT,
  timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_agent_from ON events(agent_from);
CREATE INDEX IF NOT EXISTS idx_events_agent_to ON events(agent_to);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_processed ON events(processed);
CREATE INDEX IF NOT EXISTS idx_analytics_agent ON analytics(agent);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_health_checks_agent ON health_checks(agent_type);
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp);
