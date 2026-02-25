import { Student } from './student';

export interface ExtractionResponse {
  success: boolean;
  rawText?: string;
  extractedData?: Partial<Student>;
  confidence: number;
  warnings?: string[];
  error?: string;
  requiresOCR?: boolean;
}

export interface AIInsightsRequest {
  studentId: string;
  semesters: import('./student').Semester[];
}

export interface AIInsightsResponse {
  success: boolean;
  insights?: import('./student').AIInsights;
  error?: string;
}
