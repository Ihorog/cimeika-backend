/**
 * R2 Stream Processor
 * Utilities for uploading and managing files in Cloudflare R2
 */

import type { Env } from '../types/env';

// ============================================
// TYPES
// ============================================

export interface R2UploadOptions {
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface R2UploadResult {
  success: boolean;
  key: string;
  error?: string;
}

// ============================================
// KEY GENERATION
// ============================================

/**
 * Generate a unique R2 key with prefix and extension
 * Format: {prefix}/{timestamp}-{uuid}.{extension}
 */
export function generateR2Key(prefix: string, extension: string): string {
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `${prefix}/${timestamp}-${uuid}.${extension}`;
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Upload binary or text data to R2
 */
export async function uploadToR2(
  env: Env,
  data: ArrayBuffer | string | ReadableStream,
  options: R2UploadOptions
): Promise<R2UploadResult> {
  try {
    await env.FILES.put(options.key, data, {
      httpMetadata: {
        contentType: options.contentType ?? 'application/octet-stream',
        cacheControl: options.cacheControl,
      },
      customMetadata: options.metadata,
    });

    return { success: true, key: options.key };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[R2] Upload failed for key '${options.key}':`, msg);
    return { success: false, key: options.key, error: msg };
  }
}

/**
 * Delete an object from R2
 */
export async function deleteFromR2(env: Env, key: string): Promise<void> {
  try {
    await env.FILES.delete(key);
  } catch (error) {
    console.error(`[R2] Delete failed for key '${key}':`, error);
    throw error;
  }
}

/**
 * Retrieve an object from R2 as an ArrayBuffer, or null if not found
 */
export async function getFromR2(env: Env, key: string): Promise<ArrayBuffer | null> {
  try {
    const object = await env.FILES.get(key);
    return object ? await object.arrayBuffer() : null;
  } catch (error) {
    console.error(`[R2] Get failed for key '${key}':`, error);
    return null;
  }
}

/**
 * List object keys in R2 under a given prefix
 */
export async function listR2(env: Env, prefix: string, limit = 100): Promise<string[]> {
  try {
    const result = await env.FILES.list({ prefix, limit });
    return result.objects.map((obj) => obj.key);
  } catch (error) {
    console.error('[R2] List failed:', error);
    return [];
  }
}
