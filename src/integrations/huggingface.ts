/**
 * HuggingFace API integration
 */

export interface HuggingFaceConfig {
  token: string;
  baseUrl?: string;
}

export class HuggingFaceAPI {
  private token: string;
  private baseUrl: string;

  constructor(config: HuggingFaceConfig) {
    this.token = config.token;
    this.baseUrl = config.baseUrl || 'https://api-inference.huggingface.co';
  }

  /**
   * Make HuggingFace API request
   * @param {string} model - Model ID
   * @param {unknown} inputs - Model inputs
   * @returns {Promise<unknown>} API response
   */
  private async request(model: string, inputs: unknown): Promise<unknown> {
    const url = `${this.baseUrl}/models/${model}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs }),
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generate text embeddings
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector
   */
  async embed(text: string): Promise<number[]> {
    try {
      const result = await this.request('sentence-transformers/all-MiniLM-L6-v2', text);
      return result as number[];
    } catch (error) {
      console.error('HuggingFace embed error:', error);
      throw error;
    }
  }

  /**
   * Analyze sentiment
   * @param {string} text - Text to analyze
   * @returns {Promise<unknown>} Sentiment analysis result
   */
  async sentiment(text: string): Promise<unknown> {
    try {
      return await this.request('distilbert-base-uncased-finetuned-sst-2-english', text);
    } catch (error) {
      console.error('HuggingFace sentiment error:', error);
      throw error;
    }
  }

  /**
   * Generate text
   * @param {string} prompt - Text prompt
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt: string): Promise<string> {
    try {
      const result = await this.request('gpt2', prompt);
      return (result as Array<{ generated_text: string }>)[0]?.generated_text || '';
    } catch (error) {
      console.error('HuggingFace generate error:', error);
      throw error;
    }
  }
}
