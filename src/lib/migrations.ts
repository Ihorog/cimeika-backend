/**
 * Database migrations system
 * Tracks schema versions and applies updates
 */

import type { Env } from '../types';

const CURRENT_VERSION = 1;

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
