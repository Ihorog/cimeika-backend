/**
 * Database migrations system
 * Tracks schema versions and applies updates
 */

import type { Env } from '../types';

const CURRENT_VERSION = 2;

export async function runMigrations(env: Env): Promise<void> {
  if (!env.DB) return;

  try {
    // Create migrations table if needed
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Get current version
    const result = await env.DB.prepare(
      'SELECT MAX(version) as version FROM schema_version'
    ).first();

    const currentVersion = (result?.version as number) || 0;

    if (currentVersion >= CURRENT_VERSION) {
      console.log(`Database at version ${currentVersion}`);
      return;
    }

    // Apply migrations
    if (currentVersion < 1) {
      await migration_001(env);
      await env.DB.prepare(
        'INSERT INTO schema_version (version) VALUES (?)'
      ).bind(1).run();
      console.log('Migration 001 applied');
    }

    if (currentVersion < 2) {
      await migration_002(env);
      await env.DB.prepare(
        'INSERT INTO schema_version (version) VALUES (?)'
      ).bind(2).run();
      console.log('Migration 002 applied');
    }

    console.log(`Database at version ${CURRENT_VERSION}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function migration_001(_env: Env): Promise<void> {
  // Initial schema (already created in db-init.ts)
  // This is a placeholder for future migrations
}

async function migration_002(env: Env): Promise<void> {
    // ALTER TABLE does not support IF NOT EXISTS in SQLite; catch duplicate-column error
    try {
    await env.DB.prepare('ALTER TABLE stories ADD COLUMN prompt TEXT').run();
  } catch {
    // Column may already exist in older deployments — safe to ignore
  }

  // Create gallery_items table
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS gallery_items (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      prompt TEXT NOT NULL,
      generator TEXT NOT NULL DEFAULT 'ai-anime-generator',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(
    'CREATE INDEX IF NOT EXISTS idx_gallery_created ON gallery_items(created_at)'
  ).run();
}
