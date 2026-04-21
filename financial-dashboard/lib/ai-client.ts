import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { extractSummaryInput } from './ai-prompts';
import type { WorkbookResult } from './types';

interface GenerateOptions {
  systemPrompt: string;
  userPromptBuilder: (input: NonNullable<ReturnType<typeof extractSummaryInput>>) => string;
  maxTokens?: number;
}

export async function generateAiResponse(
  request: NextRequest,
  { systemPrompt, userPromptBuilder, maxTokens = 2048 }: GenerateOptions,
): Promise<NextResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.',
      },
      { status: 500 },
    );
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  let workbook: WorkbookResult;
  try {
    workbook = (await request.json()) as WorkbookResult;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body. Expected parsed workbook JSON.' },
      { status: 400 },
    );
  }

  if (!workbook || !Array.isArray(workbook.reports)) {
    return NextResponse.json(
      { error: 'Request body is missing parsed workbook data.' },
      { status: 400 },
    );
  }

  const summaryInput = extractSummaryInput(workbook.reports, workbook.derivedMetrics ?? {});
  if (!summaryInput) {
    return NextResponse.json(
      { error: 'Unable to extract organization or period from the uploaded data.' },
      { status: 400 },
    );
  }

  const userPrompt = userPromptBuilder(summaryInput);

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return NextResponse.json({
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens,
        cacheWriteTokens: response.usage.cache_creation_input_tokens,
      },
      model: response.model,
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'Invalid ANTHROPIC_API_KEY. Check your .env.local file.' },
        { status: 401 },
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Rate limited by Anthropic API. Try again in a moment.' },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error (${err.status}): ${err.message}` },
        { status: err.status ?? 500 },
      );
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
