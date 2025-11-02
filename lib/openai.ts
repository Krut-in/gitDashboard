/**
 * OpenAI Client Configuration
 * 
 * Provides a singleton OpenAI client instance for use across the application.
 * Requires OPENAI_API_KEY to be set in environment variables.
 */

import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 * @returns OpenAI client instance
 * @throws Error if OPENAI_API_KEY is not configured
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

/**
 * Check if OpenAI API is configured
 * @returns true if API key is set
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
