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
  uptime_seconds INTEGER NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
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

-- Mood tracking (Настрій)
CREATE TABLE IF NOT EXISTS mood_entries (
  id TEXT PRIMARY KEY,
  mood TEXT NOT NULL,
  score REAL NOT NULL CHECK(score >= 0 AND score <= 10),
  note TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Ideas (Маля)
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'active', 'done', 'archived')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Stories (Казкар)
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  prompt TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Calendar events (Календар)
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'event',
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Gallery items (generated via Perchance)
CREATE TABLE IF NOT EXISTS gallery_items (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  generator TEXT NOT NULL DEFAULT 'ai-anime-generator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gallery_created ON gallery_items(created_at);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_mood_created ON mood_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created_at);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(date);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_agent_from ON events(agent_from);
CREATE INDEX IF NOT EXISTS idx_events_agent_to ON events(agent_to);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_processed ON events(processed);
CREATE INDEX IF NOT EXISTS idx_analytics_agent ON analytics(agent);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_health_checks_agent ON health_checks(agent_type);
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp);
