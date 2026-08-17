/**
 * Planner
 *
 * Given the user's message, its classified intent, and the tools available,
 * decides which tool(s) to call and with what arguments.
 */

import { geminiFlash } from '../../lib/llm.js';
import { PLAN_PROMPT } from './prompts/index.js';
import type { Tool } from './tools/index.js';

export interface PlannedStep {
  tool: string;
  args: Record<string, any>;
}

export interface Plan {
  steps: PlannedStep[];
  reasoning: string;
}

function extractJson(text: string): any {
  const cleaned = text.trim().replace(/^```json\s*|^```\s*|\s*```$/g, '');
  return JSON.parse(cleaned);
}

export async function planActions(
  message: string,
  intent: string,
  tools: Tool[],
  contextSummary: string
): Promise<Plan> {
  const toolDescriptions = tools
    .map((t) => `- ${t.name}: ${t.description}\n  parameters: ${JSON.stringify(t.parameters)}`)
    .join('\n');

  const prompt = `${PLAN_PROMPT}

Intent: ${intent}

Available tools:
${toolDescriptions}

Context about the creator:
${contextSummary}

User message: "${message}"

Respond with ONLY a JSON object (no markdown fences): {"steps": [{"tool": string, "args": object}], "reasoning": string}
Only include tools from the list above. Use at most 3 steps. If a required id (task id, video id, sponsorship id)
isn't known from context, prefer a "list"/"get" tool first rather than guessing an id.`;

  try {
    const response = await geminiFlash.invoke(prompt);
    const text = typeof response.content === 'string' ? response.content : String(response.content);
    const parsed = extractJson(text);
    const validNames = new Set(tools.map((t) => t.name));
    const steps: PlannedStep[] = Array.isArray(parsed.steps)
      ? parsed.steps.filter((s: any) => s && validNames.has(s.tool)).slice(0, 3)
      : [];

    return { steps, reasoning: parsed.reasoning ?? '' };
  } catch {
    return { steps: [], reasoning: 'Planning failed; falling back to a direct response.' };
  }
}
