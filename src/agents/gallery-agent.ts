/**
 * Gallery Agent - Media Storage
 * Manages image and file storage via R2 bucket
 */

import { BaseAgent } from './base-agent';
import type { Env } from '../types/env';
import type { AgentMessage } from '../types/agents';
import { generateImage, type PerchanceGenerator } from '../services/perchance';
import { uploadToR2, generateR2Key } from '../services/r2-stream';

export class GalleryAgent extends BaseAgent {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env, 'gallery');
    this.setStatus('ready');
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === '/health') {
        return this.jsonResponse({
          agent: 'gallery',
          status: this.agentState.status,
          uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
          message_count: this.agentState.message_count,
          error_count: this.agentState.error_count,
          timestamp: new Date().toISOString(),
        });
      }

      if (path === '/state') {
        return this.jsonResponse(this.getState() as unknown as Record<string, unknown>);
      }

      if (path === '/status') {
        return this.jsonResponse(this.getState() as unknown as Record<string, unknown>);
      }

      if (path === '/message' && method === 'POST') {
        return this.handleIncomingMessage(request);
      }

      if (path === '/' && method === 'POST') {
        return this.handleIncomingMessage(request);
      }

      if (path === '/files' && method === 'GET') {
        const listing = await this.env.FILES.list();
        const files = listing.objects.map((obj) => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
        }));
        return this.jsonResponse({ files, message: 'Список файлів', timestamp: new Date().toISOString() });
      }

      if (path === '/upload' && method === 'POST') {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) {
          return this.errorResponse('Файл не знайдено у запиті', 400);
        }
        const key = crypto.randomUUID();
        await this.uploadToR2(key, await file.arrayBuffer(), file.type);
        return this.jsonResponse({ success: true, key, message: 'Файл завантажено', timestamp: new Date().toISOString() });
      }

      if (path.startsWith('/files/') && method === 'GET') {
        const key = decodeURIComponent(path.slice('/files/'.length));
        const object = await this.env.FILES.get(key);
        if (!object) {
          return this.errorResponse('Файл не знайдено', 404);
        }
        const contentType = object.httpMetadata?.contentType ?? 'application/octet-stream';
        return new Response(await object.arrayBuffer(), {
          status: 200,
          headers: { 'Content-Type': contentType },
        });
      }

      if (path.startsWith('/files/') && method === 'DELETE') {
        const key = decodeURIComponent(path.slice('/files/'.length));
        await this.env.FILES.delete(key);
        return this.jsonResponse({ success: true, message: 'Файл видалено', timestamp: new Date().toISOString() });
      }

      return this.errorResponse('Not found', 404);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[GalleryAgent] fetch error: ${msg}`);
      return this.errorResponse(msg);
    }
  }

  protected async processMessage(
    message: AgentMessage
  ): Promise<Record<string, any>> {
    const action = message.payload?.action;

    switch (action) {
      case 'upload': {
        const { filename, contentType } = message.payload;
        return {
          success: true,
          file_id: message.id,
          filename,
          contentType,
          message: 'Файл завантажено',
          timestamp: new Date().toISOString(),
        };
      }

      case 'list_files':
        return {
          files: [],
          message: 'Список файлів',
          timestamp: new Date().toISOString(),
        };

      case 'upload-file': {
        const { key, body, contentType } = message.payload;
        await this.uploadToR2(String(key ?? ''), body, contentType ? String(contentType) : undefined);
        return { success: true, key, message: 'Файл завантажено', timestamp: new Date().toISOString() };
      }

      case 'list-files': {
        const listing = await this.env.FILES.list();
        const files = listing.objects.map((obj) => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
        }));
        return { files, message: 'Список файлів', timestamp: new Date().toISOString() };
      }

      case 'get-file': {
        const { key } = message.payload;
        const data = await this.downloadFromR2(String(key ?? ''));
        return { found: data !== null, key, message: data ? 'Файл знайдено' : 'Файл не знайдено', timestamp: new Date().toISOString() };
      }

      case 'delete-file': {
        const { key } = message.payload;
        await this.env.FILES.delete(String(key ?? ''));
        return { success: true, key, message: 'Файл видалено', timestamp: new Date().toISOString() };
      }

      default:
        return {
          received: true,
          action: action ?? 'unknown',
          timestamp: new Date().toISOString(),
        };
    }
  }

  /**
   * Generate an image via Perchance and upload it to R2
   */
  async generateImage(payload: {
    prompt: string;
    generator?: PerchanceGenerator;
  }): Promise<Record<string, unknown>> {
    const { prompt, generator = 'ai-anime-generator' } = payload;

    const imageResult = await generateImage(prompt, generator);
    if (!imageResult.success) {
      return { success: false, error: imageResult.error, timestamp: new Date().toISOString() };
    }

    let key = imageResult.imageUrl ?? '';
    if (imageResult.imageData) {
      key = generateR2Key('gallery', 'jpg');
      const binary = Uint8Array.from(atob(imageResult.imageData), (ch) => ch.charCodeAt(0));
      await uploadToR2(this.env, binary.buffer as ArrayBuffer, {
        key,
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      });
    }

    return {
      success: true,
      key,
      prompt,
      generator,
      message: 'Зображення згенеровано',
      timestamp: new Date().toISOString(),
    };
  }

  private async handleIncomingMessage(request: Request): Promise<Response> {
    const message = (await request.json()) as AgentMessage;
    const result = await this.handleMessage(message);
    return this.jsonResponse(result as unknown as Record<string, unknown>);
  }
}
