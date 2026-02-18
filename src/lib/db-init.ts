/**
 * D1 Database Initialization
 * Creates tables, indexes, and triggers on first deploy
 */

import type { Env } from '../types';

export async function initializeDatabase(env: Env): Promise<void> {
  if (!env.DB) return;

  try {
    // Check if already initialized
    const existing = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='agent_states'"
    ).first();

    if (existing) {
      console.log('Database already initialized');
      return;
    }

    // Create tables
    const schema = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Agent states table
      CREATE TABLE IF NOT EXISTS agent_states (
        agent_type TEXT PRIMARY KEY,
        state_json TEXT NOT NULL,
        uptime_seconds INTEGER DEFAULT 0,
        message_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Events table
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        agent_from TEXT NOT NULL,
        agent_to TEXT,
        event_type TEXT NOT NULL,
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Analytics table
      CREATE TABLE IF NOT EXISTS analytics (
        event_type TEXT NOT NULL,
        agent TEXT,
        data TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_events_from ON events(agent_from);
      CREATE INDEX IF NOT EXISTS idx_events_to ON events(agent_to);
      CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_agent ON analytics(agent);
      CREATE INDEX IF NOT EXISTS idx_agent_states_updated ON agent_states(updated_at);
    `;

    // Execute schema
    const statements = schema.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await env.DB.prepare(stmt).run();
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
