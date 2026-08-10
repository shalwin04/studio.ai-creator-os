/**
 * LLM Client
 *
 * Unified interface for Google Gemini models.
 */

import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { env } from './env.js';

// Gemini for reasoning and conversation
export const gemini = new ChatGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
  model: 'gemini-1.5-pro',
  temperature: 0.7,
  maxOutputTokens: 4096,
});

// Gemini Flash for faster, cheaper operations
export const geminiFlash = new ChatGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
  model: 'gemini-1.5-flash',
  temperature: 0.5,
  maxOutputTokens: 2048,
});

// Embeddings for vector search
export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: env.GOOGLE_API_KEY,
  model: 'text-embedding-004',
});

// Helper to generate embeddings
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddings.embedQuery(text);
  return result;
}

// Helper to generate multiple embeddings
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results = await embeddings.embedDocuments(texts);
  return results;
}

// Default LLM export (use gemini for main reasoning)
export const llm = gemini;
