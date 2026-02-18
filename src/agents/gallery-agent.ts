import { BaseAgent } from './base-agent';
import type { GalleryAgentState, HealthStatus, AgentMessage } from '../types/agents';
import { now, generateId } from '../lib/utils';
import { MESSAGES } from '../lib/constants';

/**
 * Gallery Agent - Media Storage (R2)
 * Manages image and file uploads to R2
 */
export class GalleryAgent extends BaseAgent<GalleryAgentState> {
  protected getDefaultState(): GalleryAgentState {
    return {
      initialized: false,
      lastActivity: now(),
      messageCount: 0,
      errorCount: 0,
      mediaCount: 0,
      totalSize: 0,
      lastUpload: 0,
    };
  }

  protected async calculateScore(): Promise<number> {
    try {
      const recentUpload = now() - this.agentState.lastUpload < 86400000 ? 1 : 0.5;
      const storageScore = this.agentState.totalSize < 1073741824 ? 1 : 0.7; // < 1GB
      const errorScore = Math.max(0, 1 - this.agentState.errorCount / 50);

      return (recentUpload + storageScore + errorScore) / 3;
    } catch {
      return 0.5;
    }
  }

  public async checkHealth(): Promise<HealthStatus> {
    try {
      const score = await this.calculateScore();
      const status = score > 0.7 ? 'healthy' : score > 0.3 ? 'degraded' : 'unhealthy';
      const message =
        status === 'healthy'
          ? MESSAGES.HEALTH_OK
          : status === 'degraded'
          ? MESSAGES.HEALTH_DEGRADED
          : MESSAGES.HEALTH_DOWN;

      await this.logAnalytics('health_check', 'gallery', { score, status });

      return {
        status,
        message,
        timestamp: now(),
        score,
        details: {
          mediaCount: this.agentState.mediaCount,
          totalSize: this.agentState.totalSize,
          lastUpload: this.agentState.lastUpload,
        },
      };
    } catch (error) {
      console.error('Gallery health check failed:', error);
      return {
        status: 'unhealthy',
        message: MESSAGES.ERROR_GENERIC,
        timestamp: now(),
        score: 0,
      };
    }
  }

  /**
   * Upload media file to R2
   * @param {ArrayBuffer} data - File data
   * @param {string} contentType - MIME type
   * @param {string} filename - Original filename
   * @returns {Promise<string>} File key
   */
  async uploadMedia(
    data: ArrayBuffer,
    contentType: string,
    filename: string
  ): Promise<string> {
    try {
      const fileId = generateId();
      const key = `media/${fileId}/${filename}`;

      const success = await this.storeFile(key, data, {
        contentType,
        uploadedAt: now().toString(),
        originalFilename: filename,
      });

      if (!success) {
        throw new Error('Failed to upload to R2');
      }

      const fileSize = data.byteLength;

      await this.setState({
        mediaCount: this.agentState.mediaCount + 1,
        totalSize: this.agentState.totalSize + fileSize,
        lastUpload: now(),
        lastActivity: now(),
      });

      await this.logAnalytics('media_uploaded', 'gallery', {
        fileId,
        filename,
        size: fileSize,
        contentType,
      });

      return key;
    } catch (error) {
      console.error('Failed to upload media:', error);
      throw error;
    }
  }

  /**
   * Get media file from R2
   * @param {string} key - File key
   * @returns {Promise<Response>} File response
   */
  async getMedia(key: string): Promise<Response> {
    try {
      const file = await this.getFile(key);

      if (!file) {
        return Response.json(
          { error: MESSAGES.ERROR_NOT_FOUND },
          { status: 404 }
        );
      }

      await this.logAnalytics('media_accessed', 'gallery', { key });

      return new Response(file.body, {
        headers: {
          'Content-Type': file.httpMetadata?.contentType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (error) {
      console.error('Failed to get media:', error);
      return Response.json(
        { error: MESSAGES.ERROR_GENERIC },
        { status: 500 }
      );
    }
  }

  protected async processMessage(message: AgentMessage): Promise<Response> {
    try {
      if (message.payload.action === 'upload') {
        // In real implementation, would handle multipart upload
        // For now, just acknowledge
        return Response.json({
          success: true,
          message: MESSAGES.SUCCESS,
        });
      }

      return await super.processMessage(message);
    } catch (error) {
      console.error('Gallery message processing failed:', error);
      return Response.json(
        { error: MESSAGES.ERROR_GENERIC },
        { status: 500 }
      );
    }
  }
}
