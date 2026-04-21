import { NextRequest } from 'next/server';
import { generateAiResponse } from '@/lib/ai-client';
import {
  CHART_EXPLANATIONS_SYSTEM_PROMPT,
  buildChartExplanationsUserPrompt,
} from '@/lib/ai-prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return generateAiResponse(request, {
    systemPrompt: CHART_EXPLANATIONS_SYSTEM_PROMPT,
    userPromptBuilder: buildChartExplanationsUserPrompt,
    maxTokens: 1024,
  });
}
