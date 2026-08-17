/**
 * Intent Classifier
 *
 * First LangGraph node after context is built: decides whether the user's
 * message requires calling tools (an action / data lookup) or can be
 * answered directly from conversation + memory context alone.
 */

import { geminiFlash } from '../../lib/llm.js';
import { CLASSIFY_PROMPT } from './prompts/index.js';

export interface ClassificationResult {
  intent: string;
  needsTools: boolean;
  requiredCapabilities: string[];
}

function extractJson(text: string): any {
  const cleaned = text.trim().replace(/^```json\s*|^```\s*|\s*```$/g, '');
  return JSON.parse(cleaned);
}

export async function classifyIntent(message: string, availableTools: string[]): Promise<ClassificationResult> {
  const prompt = `${CLASSIFY_PROMPT}

Available tools: ${availableTools.join(', ')}

Also decide "needsTools": true if answering requires calling one or more of the available tools
(creating/updating something, or looking up data you don't already have), false if it's a general
question, greeting, or something answerable from conversation context alone.

Respond with ONLY a JSON object (no markdown fences): {"intent": string, "needsTools": boolean, "requiredCapabilities": string[]}

User message: "${message}"`;

  try {
    const response = await geminiFlash.invoke(prompt);
    const text = typeof response.content === 'string' ? response.content : String(response.content);
    const parsed = extractJson(text);
    return {
      intent: parsed.intent ?? 'general',
      needsTools: Boolean(parsed.needsTools),
      requiredCapabilities: Array.isArray(parsed.requiredCapabilities) ? parsed.requiredCapabilities : [],
    };
  } catch {
    // If classification fails for any reason, default to "just answer directly"
    // rather than blocking the conversation.
    return { intent: 'general', needsTools: false, requiredCapabilities: [] };
  }
}
