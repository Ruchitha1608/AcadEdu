import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildVisionExtractionPrompt, parseExtractionResponse } from '@/lib/aiExtraction';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const studentName = formData.get('studentName') as string | undefined;

    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'AI extraction not configured. Please use manual entry.' }, { status: 503 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mediaType = (file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp') || 'image/jpeg';

    const client = new Anthropic({ apiKey });
    const prompt = buildVisionExtractionPrompt(studentName);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const extractedData = parseExtractionResponse(responseText);

    return NextResponse.json({ success: true, extractedData, confidence: 0.80 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
