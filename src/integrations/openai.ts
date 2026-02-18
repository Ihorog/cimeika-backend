import OpenAI from 'openai';

/**
 * OpenAI API integration
 */

export interface OpenAIConfig {
  apiKey: string;
}

export class OpenAIService {
  private client: OpenAI;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  /**
   * Generate chat completion
   * @param {string} prompt - User prompt
   * @param {string} systemPrompt - System prompt
   * @param {number} maxTokens - Maximum tokens
   * @returns {Promise<string>} Generated text
   */
  async chat(
    prompt: string,
    systemPrompt: string = 'Ти корисний асистент.',
    maxTokens: number = 500
  ): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw error;
    }
  }

  /**
   * Generate streaming chat completion
   * @param {string} prompt - User prompt
   * @param {string} systemPrompt - System prompt
   * @param {number} maxTokens - Maximum tokens
   * @returns {Promise<ReadableStream>} Stream
   */
  async chatStream(
    prompt: string,
    systemPrompt: string = 'Ти корисний асистент.',
    maxTokens: number = 500
  ): Promise<ReadableStream> {
    try {
      const stream = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        stream: true,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return readable;
    } catch (error) {
      console.error('OpenAI stream error:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('OpenAI embed error:', error);
      throw error;
    }
  }
}
