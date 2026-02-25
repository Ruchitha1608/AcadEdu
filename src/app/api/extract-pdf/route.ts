import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildTextExtractionPrompt, parseExtractionResponse } from '@/lib/aiExtraction';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const studentName = formData.get('studentName') as string | undefined;

    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();

    // Extract text from PDF using pdfjs-dist
    let rawText = '';
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const textParts: string[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
        textParts.push(text);
      }
      rawText = textParts.join('\n\n');
    } catch {
      return NextResponse.json({ success: false, error: 'Could not parse PDF. Try an image instead.', requiresOCR: true }, { status: 422 });
    }

    if (!rawText.trim() || rawText.length < 100) {
      return NextResponse.json({ success: false, error: 'PDF appears to be image-based. Try uploading as an image.', requiresOCR: true }, { status: 422 });
    }

    // Send to Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'AI extraction not configured. Please use manual entry.' }, { status: 503 });
    }

    const client = new Anthropic({ apiKey });
    const prompt = buildTextExtractionPrompt(rawText, studentName);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const extractedData = parseExtractionResponse(responseText);

    return NextResponse.json({ success: true, extractedData, rawText: rawText.slice(0, 500), confidence: 0.85 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
