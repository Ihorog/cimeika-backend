/**
 * GitHub API integration
 */

export interface GitHubConfig {
  token: string;
  baseUrl?: string;
}

export class GitHubAPI {
  private token: string;
  private baseUrl: string;

  constructor(config: GitHubConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl || 'https://api.github.com';
  }

  /**
   * Make GitHub API request
   * @param {string} endpoint - API endpoint
   * @param {RequestInit} options - Fetch options
   * @returns {Promise<unknown>} API response
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get repository information
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<unknown>} Repository data
   */
  async getRepository(owner: string, repo: string): Promise<unknown> {
    return await this.request(`/repos/${owner}/${repo}`);
  }

  /**
   * Get repository issues
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<unknown>} Issues data
   */
  async getIssues(owner: string, repo: string): Promise<unknown> {
    return await this.request(`/repos/${owner}/${repo}/issues`);
  }

  /**
   * Create webhook
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} webhookUrl - Webhook URL
   * @returns {Promise<unknown>} Webhook data
   */
  async createWebhook(owner: string, repo: string, webhookUrl: string): Promise<unknown> {
    return await this.request(`/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push', 'pull_request', 'issues'],
        config: {
          url: webhookUrl,
          content_type: 'json',
        },
      }),
    });
  }

  /**
   * Handle webhook payload
   * @param {Request} request - Webhook request
   * @returns {Promise<unknown>} Parsed payload
   */
  static async handleWebhook(request: Request): Promise<unknown> {
    const payload = await request.json();
    const event = request.headers.get('X-GitHub-Event');

    return {
      event,
      payload,
    };
  }
}
