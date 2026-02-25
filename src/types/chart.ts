export interface CGPATrendDataPoint {
  semester: string;
  sgpa: number;
  cgpa: number;
  isPredicted?: boolean;
}

export interface SubjectBarDataPoint {
  subject: string;
  code: string;
  gradePoint: number;
  credits: number;
  attendance?: number;
  grade: string;
}

export interface RadarDataPoint {
  skill: string;
  score: number;
  fullMark: number;
}

export interface HeatmapCell {
  month: string;
  semester: number;
  value: number;
}

export interface ComparisonDataPoint {
  metric: string;
  [studentName: string]: number | string;
}
