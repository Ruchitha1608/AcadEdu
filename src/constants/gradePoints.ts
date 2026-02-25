export const GRADE_POINTS: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8.5,
  'B+': 8,
  'B': 7,
  'C': 6,
  'P': 5,
  'F': 0,
  'Ab': 0,
  'W': 0,
};

export const GRADE_POINTS_7: Record<string, number> = {
  'O': 7, 'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 0,
};

export function gradeToPoint(grade: string): number {
  const normalized = grade.trim().toUpperCase();
  return GRADE_POINTS[normalized] ?? GRADE_POINTS[grade.trim()] ?? 0;
}

export function gradeColor(gradePoint: number): string {
  if (gradePoint >= 9) return '#22c55e';
  if (gradePoint >= 8) return '#3b82f6';
  if (gradePoint >= 7) return '#a855f7';
  if (gradePoint >= 6) return '#eab308';
  if (gradePoint >= 5) return '#f97316';
  return '#ef4444';
}

export function cgpaColor(cgpa: number): string {
  if (cgpa >= 8.5) return 'text-green-600';
  if (cgpa >= 7) return 'text-blue-600';
  if (cgpa >= 6) return 'text-yellow-600';
  return 'text-red-600';
}

export function cgpaBadgeColor(cgpa: number): string {
  if (cgpa >= 8.5) return 'bg-green-100 text-green-700 border-green-200';
  if (cgpa >= 7) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (cgpa >= 6) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
}
