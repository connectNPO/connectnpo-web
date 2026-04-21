import { NextRequest } from 'next/server';
import { generateAiResponse } from '@/lib/ai-client';
import {
  EXECUTIVE_SUMMARY_SYSTEM_PROMPT,
  buildExecutiveSummaryUserPrompt,
} from '@/lib/ai-prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return generateAiResponse(request, {
    systemPrompt: EXECUTIVE_SUMMARY_SYSTEM_PROMPT,
    userPromptBuilder: buildExecutiveSummaryUserPrompt,
    maxTokens: 2048,
  });
}
