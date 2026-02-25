import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Semester, AIInsights } from '@/types/student';
import { predictNextSemester, getSubjectRecommendations, getStrengths, getWarnings } from '@/lib/predictions';
import { computeConsistencyScore, getConsistencyLabel } from '@/lib/consistency';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, semesters } = body as { studentId: string; semesters: Semester[] };

    if (!semesters?.length) {
      return NextResponse.json({ success: false, error: 'No semester data provided' }, { status: 400 });
    }

    // Compute ML predictions
    const mlResult = predictNextSemester(semesters);
    const { predictedSGPA, predictedCGPA, confidence } = mlResult;
    const consistencyScore = computeConsistencyScore(semesters);
    const localRecommendations = getSubjectRecommendations(semesters);
    const localStrengths = getStrengths(semesters);
    const localWarnings = getWarnings(semesters);

    // Try AI enhancement
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let aiStrengths: string[] = [];
    let aiWarnings: string[] = [];

    if (apiKey) {
      try {
        const client = new Anthropic({ apiKey });
        const semSummary = semesters.map((s) => ({
          sem: s.semesterNumber,
          sgpa: s.sgpa,
          cgpa: s.cgpaAfterSemester,
          attendance: s.overallAttendance,
          subjects: s.subjects.map((sub) => `${sub.name}(${sub.grade})`).join(', '),
        }));

        const message = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Analyze this student's academic data and provide brief, specific insights.

Semester data: ${JSON.stringify(semSummary)}

Return ONLY valid JSON:
{
  "strengths": ["string", "string"],
  "warnings": ["string", "string"]
}

Be specific and actionable. Max 3 strengths and 3 warnings.`,
          }],
        });

        const text = message.content[0].type === 'text' ? message.content[0].text : '';
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleaned);
        aiStrengths = parsed.strengths ?? [];
        aiWarnings = parsed.warnings ?? [];
      } catch {
        // Fall back to local insights
      }
    }

    const insights: AIInsights = {
      predictedNextSGPA: predictedSGPA,
      predictedNextCGPA: predictedCGPA,
      predictionConfidence: confidence,
      predictionMethod: mlResult.method,
      predictionBreakdown: mlResult.breakdown,
      recommendedSubjects: localRecommendations,
      consistencyScore,
      consistencyLabel: getConsistencyLabel(consistencyScore),
      strengths: aiStrengths.length ? aiStrengths : localStrengths,
      warnings: aiWarnings.length ? aiWarnings : localWarnings,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, insights });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI insights failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
