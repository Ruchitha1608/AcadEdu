import { Semester } from '@/types/student';
import { AIInsights } from '@/types/student';

function simpleSlope(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  const denom = n * sumXX - sumX * sumX;
  return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

export function computeConsistencyScore(semesters: Semester[]): number {
  if (!semesters || semesters.length < 2) return 50;

  const sorted = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);
  const sgpaValues = sorted.map((s) => s.sgpa);
  const attendanceValues = sorted.map((s) => s.overallAttendance);

  // Sub-score 1: SGPA Variance (40%)
  const mean = sgpaValues.reduce((a, b) => a + b, 0) / sgpaValues.length;
  const variance = sgpaValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / sgpaValues.length;
  const stdDev = Math.sqrt(variance);
  const varianceScore = Math.max(0, 100 - (stdDev / 2.0) * 100);

  // Sub-score 2: Trend Direction (30%)
  const x = sorted.map((_, i) => i + 1);
  const slope = simpleSlope(x, sgpaValues);
  let trendScore: number;
  if (slope >= 0.2) trendScore = 100;
  else if (slope >= 0) trendScore = 60 + (slope / 0.2) * 40;
  else if (slope >= -0.2) trendScore = 40 + ((slope + 0.2) / 0.2) * 20;
  else trendScore = Math.max(0, 40 + slope * 100);

  // Sub-score 3: Attendance Consistency (20%)
  const avgAttendance = attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length;
  const attendanceVariance =
    attendanceValues.reduce((acc, v) => acc + Math.pow(v - avgAttendance, 2), 0) / attendanceValues.length;
  const attendanceStdDev = Math.sqrt(attendanceVariance);
  const attendanceScore = (avgAttendance / 100) * 70 + Math.max(0, 30 - (attendanceStdDev / 20) * 30);

  // Sub-score 4: Backlog Penalty (10%)
  const totalBacklogs = sorted.reduce((acc, s) => acc + s.backlogs, 0);
  const backlogScore = Math.max(0, 100 - totalBacklogs * 20);

  const composite = varianceScore * 0.4 + trendScore * 0.3 + attendanceScore * 0.2 + backlogScore * 0.1;

  return Math.round(Math.min(100, Math.max(0, composite)));
}

export function getConsistencyLabel(score: number): AIInsights['consistencyLabel'] {
  if (score >= 85) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Average';
  return 'Inconsistent';
}
