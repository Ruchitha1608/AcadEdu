import { Student, Semester, Subject } from '@/types/student';
import { gradeToPoint } from '@/constants/gradePoints';

export const EXTRACTION_SCHEMA = `{
  "name": "string | null",
  "rollNumber": "string | null",
  "department": "string | null",
  "program": "string | null",
  "batch": "string | null",
  "university": "string | null",
  "semesters": [
    {
      "semesterNumber": "number",
      "academicYear": "string | null",
      "sgpa": "number | null",
      "cgpaAfterSemester": "number | null",
      "totalCredits": "number | null",
      "earnedCredits": "number | null",
      "overallAttendance": "number | null",
      "subjects": [
        {
          "code": "string | null",
          "name": "string",
          "credits": "number | null",
          "grade": "string | null",
          "gradePoint": "number | null",
          "marksObtained": "number | null",
          "maxMarks": "number | null",
          "attendancePercentage": "number | null"
        }
      ]
    }
  ],
  "extractionWarnings": ["string"]
}`;

export function buildTextExtractionPrompt(rawText: string, studentNameHint?: string): string {
  return `You are an academic data extraction specialist. Extract structured academic data from the following document text.

${studentNameHint ? `The student's name is likely: ${studentNameHint}` : ''}

DOCUMENT TEXT:
---
${rawText.slice(0, 8000)}
---

Extract ALL available data and return a JSON object following EXACTLY this schema.
Use null for any field that cannot be found. Do NOT guess or invent values.
Return ONLY valid JSON, no explanation, no markdown code fences.

Schema:
${EXTRACTION_SCHEMA}

Rules:
1. If SGPA is not present but individual grade points and credits are, compute it: SGPA = sum(gradePoint * credits) / sum(credits)
2. If grade letter is present but grade point is not, map using: O=10, A+=9, A=8.5, B+=8, B=7, C=6, P=5, F=0, Ab=0
3. If multiple grade scales exist, note in extractionWarnings
4. Preserve all semesters found in the document
5. Attendance may appear as percentage (75.5%) or ratio (45/60) — convert to percentage`;
}

export function buildVisionExtractionPrompt(studentNameHint?: string): string {
  return `You are analyzing an academic document image (marksheet, grade card, or transcript).

${studentNameHint ? `The student's name is likely: ${studentNameHint}` : ''}

Read all visible text, tables, and data from this image carefully.
Extract the academic data and return ONLY valid JSON following this schema exactly.
No markdown, no explanation.

Schema:
${EXTRACTION_SCHEMA}

Pay special attention to:
- Tables with Subject Code, Subject Name, Credits, Grade, Grade Point headers
- SGPA/CGPA usually at the bottom of the grade table
- Attendance may be a separate column or section
- University letterhead for institution name and batch info
- Compute SGPA from subjects if not explicitly stated`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function parseExtractionResponse(responseText: string): Partial<Student> {
  const cleaned = responseText
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  const raw = JSON.parse(cleaned);

  const semesters: Semester[] = (raw.semesters ?? []).map((s: Record<string, unknown>, idx: number) => {
    const subjectsRaw = (s.subjects as Record<string, unknown>[]) ?? [];
    const subjects: Subject[] = subjectsRaw.map((sub: Record<string, unknown>) => {
      const grade = (sub.grade as string) ?? '';
      const gradePoint = (sub.gradePoint as number) ?? gradeToPoint(grade);
      return {
        id: generateId(),
        code: (sub.code as string) ?? '',
        name: (sub.name as string) ?? 'Unknown Subject',
        credits: (sub.credits as number) ?? 3,
        grade,
        gradePoint,
        marksObtained: sub.marksObtained as number | undefined,
        maxMarks: sub.maxMarks as number | undefined,
        attendancePercentage: sub.attendancePercentage as number | undefined,
      };
    });

    // Compute SGPA if missing
    let sgpa = (s.sgpa as number) ?? 0;
    if (!sgpa && subjects.length > 0) {
      const totalCredits = subjects.reduce((acc, sub) => acc + sub.credits, 0);
      const weightedSum = subjects.reduce((acc, sub) => acc + sub.gradePoint * sub.credits, 0);
      sgpa = totalCredits > 0 ? parseFloat((weightedSum / totalCredits).toFixed(2)) : 0;
    }

    const totalCredits = (s.totalCredits as number) ?? subjects.reduce((acc, sub) => acc + sub.credits, 0);
    const backlogs = subjects.filter((sub) => sub.gradePoint === 0).length;

    return {
      id: generateId(),
      semesterNumber: (s.semesterNumber as number) ?? idx + 1,
      academicYear: (s.academicYear as string) ?? '',
      sgpa,
      cgpaAfterSemester: (s.cgpaAfterSemester as number) ?? sgpa,
      totalCredits,
      earnedCredits: (s.earnedCredits as number) ?? totalCredits - backlogs * 3,
      subjects,
      attendance: [],
      overallAttendance: (s.overallAttendance as number) ?? 85,
      backlogs,
    };
  });

  // Compute cumulative CGPA if missing
  let cumulativeCredits = 0;
  let cumulativeWeighted = 0;
  for (const sem of semesters) {
    if (!sem.cgpaAfterSemester || sem.cgpaAfterSemester === sem.sgpa) {
      cumulativeCredits += sem.totalCredits;
      cumulativeWeighted += sem.sgpa * sem.totalCredits;
      sem.cgpaAfterSemester = parseFloat((cumulativeWeighted / cumulativeCredits).toFixed(2));
    }
  }

  const currentCGPA = semesters.length > 0 ? semesters[semesters.length - 1].cgpaAfterSemester : 0;

  return {
    name: (raw.name as string) ?? '',
    rollNumber: (raw.rollNumber as string) ?? '',
    department: (raw.department as string) ?? '',
    program: (raw.program as string) ?? 'B.Tech',
    batch: (raw.batch as string) ?? '',
    university: (raw.university as string) ?? '',
    semesters,
    currentCGPA,
    currentSemester: semesters.length,
  };
}
