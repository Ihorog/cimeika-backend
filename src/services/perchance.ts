/**
 * Perchance AI Integration Service
 * Uses the diy-perchance-api to generate images and text via perchance.org
 */

import { DEFAULT_TIMEOUT, MAX_RETRIES } from '../lib/constants';

// ============================================
// TYPES
// ============================================

export type PerchanceGenerator =
  | 'ai-anime-generator'
  | 'ai-furry-generator'
  | 'ai-landscape-generator'
  | 'ai-portrait-generator'
  | 'ai-text'
  | 'ai-character-generator';

export interface PerchanceImageResponse {
  success: boolean;
  imageUrl?: string;
  imageData?: string;
  generator: PerchanceGenerator;
  prompt: string;
  error?: string;
}

export interface PerchanceTextResponse {
  success: boolean;
  text?: string;
  generator: string;
  prompt: string;
  error?: string;
}

export interface PerchanceResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface TextGenerationParams {
  maxLength?: number;
  temperature?: number;
}

// ============================================
// CONSTANTS
// ============================================

const PERCHANCE_IMAGE_API = 'https://image-generation.perchance.org/api/generate';
const PERCHANCE_TEXT_API = 'https://text-generation.perchance.org/api/generate';

const GENERATOR_URLS: Record<PerchanceGenerator, string> = {
  'ai-anime-generator': PERCHANCE_IMAGE_API,
  'ai-furry-generator': PERCHANCE_IMAGE_API,
  'ai-landscape-generator': PERCHANCE_IMAGE_API,
  'ai-portrait-generator': PERCHANCE_IMAGE_API,
  'ai-text': PERCHANCE_TEXT_API,
  'ai-character-generator': PERCHANCE_IMAGE_API,
};

// ============================================
// HELPERS
// ============================================

/**
 * Fetch with timeout and exponential-backoff retry
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Perchance] Attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);
    }

    if (attempt < maxRetries - 1) {
      const backoffMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Generate an image via a Perchance image generator
 */
export async function generateImage(
  prompt: string,
  generator: PerchanceGenerator = 'ai-anime-generator'
): Promise<PerchanceImageResponse> {
  try {
    const url = GENERATOR_URLS[generator];

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        prompt,
        generator,
        negativePrompt: '',
        imageSize: '512x512',
        seed: -1,
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    return {
      success: true,
      imageUrl: data.url as string | undefined,
      imageData: data.image as string | undefined,
      generator,
      prompt,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Perchance] generateImage failed:', msg);
    return { success: false, error: msg, generator, prompt };
  }
}

/**
 * Generate text via the Perchance text generator
 */
export async function generateText(
  prompt: string,
  params?: TextGenerationParams
): Promise<PerchanceTextResponse> {
  try {
    const response = await fetchWithRetry(PERCHANCE_TEXT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        prompt,
        generator: 'ai-text',
        maxLength: params?.maxLength ?? 500,
        temperature: params?.temperature ?? 0.7,
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    return {
      success: true,
      text: data.text as string | undefined,
      generator: 'ai-text',
      prompt,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Perchance] generateText failed:', msg);
    return { success: false, error: msg, generator: 'ai-text', prompt };
  }
}

/**
 * Returns all supported generators and their API URLs
 */
export function getAvailableGenerators(): Record<string, string> {
  return { ...GENERATOR_URLS };
}

/**
 * Entry-point for generic Perchance generation from an HTTP request body
 */
export async function generateFromPerchance(
  request: Request,
  // env is accepted for future bindings (e.g. caching)
  _env: unknown
): Promise<PerchanceResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const prompt = String(body.prompt ?? '');
    const type = String(body.type ?? 'image');
    const generator = (body.generator as PerchanceGenerator) ?? 'ai-anime-generator';

    if (type === 'text') {
      const result = await generateText(prompt, {
        maxLength: body.maxLength as number | undefined,
        temperature: body.temperature as number | undefined,
      });
      return { success: result.success, data: result, error: result.error };
    }

    const result = await generateImage(prompt, generator);
    return { success: result.success, data: result, error: result.error };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Perchance] generateFromPerchance failed:', msg);
    return { success: false, error: msg };
  }
}
