/**
 * Vercel API integration
 */

export interface VercelConfig {
  token: string;
  baseUrl?: string;
}

export class VercelAPI {
  private token: string;
  private baseUrl: string;

  constructor(config: VercelConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl || 'https://api.vercel.com';
  }

  /**
   * Make Vercel API request
   * @param {string} endpoint - API endpoint
   * @param {RequestInit} options - Fetch options
   * @returns {Promise<unknown>} API response
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get deployment status
   * @param {string} deploymentId - Deployment ID
   * @returns {Promise<unknown>} Deployment data
   */
  async getDeployment(deploymentId: string): Promise<unknown> {
    return await this.request(`/v13/deployments/${deploymentId}`);
  }

  /**
   * List deployments
   * @param {string} projectId - Project ID
   * @returns {Promise<unknown>} Deployments list
   */
  async listDeployments(projectId?: string): Promise<unknown> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return await this.request(`/v6/deployments${query}`);
  }

  /**
   * Get project
   * @param {string} projectId - Project ID
   * @returns {Promise<unknown>} Project data
   */
  async getProject(projectId: string): Promise<unknown> {
    return await this.request(`/v9/projects/${projectId}`);
  }

  /**
   * Check deployment readiness
   * @param {string} url - Deployment URL
   * @returns {Promise<boolean>} True if ready
   */
  async checkDeployment(url: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }
}
