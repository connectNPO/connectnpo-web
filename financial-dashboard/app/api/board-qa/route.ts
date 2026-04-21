import { NextRequest } from 'next/server';
import { generateAiResponse } from '@/lib/ai-client';
import { BOARD_QA_SYSTEM_PROMPT, buildBoardQAUserPrompt } from '@/lib/ai-prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return generateAiResponse(request, {
    systemPrompt: BOARD_QA_SYSTEM_PROMPT,
    userPromptBuilder: buildBoardQAUserPrompt,
    maxTokens: 2048,
  });
}
