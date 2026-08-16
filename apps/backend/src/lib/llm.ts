/**
 * LLM Client
 *
 * Unified interface for Google Gemini models.
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { env } from './env.js';

const GENAI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const EMBEDDING_MODEL = 'gemini-embedding-001';
// Must match the `embedding vector(768)` column (drizzle/0005_pgvector_agent_memory.sql).
// gemini-embedding-001 defaults to a larger vector; output_dimensionality truncates it via MRL.
const EMBEDDING_DIMENSIONS = 768;

// Gemini for reasoning and conversation
export const gemini = new ChatGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
  model: 'gemini-3.5-flash',
  temperature: 0.7,
  maxOutputTokens: 4096,
});

// Gemini Flash for faster, cheaper operations
export const geminiFlash = new ChatGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY,
  model: 'gemini-3.5-flash',
  temperature: 0.5,
  maxOutputTokens: 2048,
});

// Helper to generate embeddings. Calls the REST API directly rather than
// the langchain wrapper, since the installed @langchain/google-genai version
// doesn't support output_dimensionality (needed to match our vector(768) column).
export async function generateEmbedding(text: string): Promise<number[]> {
  const resp = await fetch(`${GENAI_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${env.GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Failed to generate embedding: ${resp.status} ${await resp.text()}`);
  }

  const data = (await resp.json()) as { embedding: { values: number[] } };
  return data.embedding.values;
}

// Helper to generate multiple embeddings in one batch request.
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const resp = await fetch(`${GENAI_BASE}/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${env.GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      })),
    }),
  });

  if (!resp.ok) {
    throw new Error(`Failed to generate embeddings: ${resp.status} ${await resp.text()}`);
  }

  const data = (await resp.json()) as { embeddings: { values: number[] }[] };
  return data.embeddings.map((e) => e.values);
}

// Default LLM export (use gemini for main reasoning)
export const llm = gemini;
