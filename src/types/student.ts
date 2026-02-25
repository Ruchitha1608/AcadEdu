export type LetterGrade = 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' | 'Ab' | 'W' | string;

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  grade: LetterGrade;
  gradePoint: number;
  marksObtained?: number;
  maxMarks?: number;
  attendancePercentage?: number;
  category?: 'core' | 'elective' | 'lab' | 'project';
}

export interface AttendanceRecord {
  month: string;
  percentage: number;
  classesHeld: number;
  classesAttended: number;
}

export interface Semester {
  id: string;
  semesterNumber: number;
  academicYear: string;
  session?: 'odd' | 'even';
  sgpa: number;
  cgpaAfterSemester: number;
  totalCredits: number;
  earnedCredits: number;
  subjects: Subject[];
  attendance: AttendanceRecord[];
  overallAttendance: number;
  backlogs: number;
}

export interface AIInsights {
  predictedNextSGPA: number;
  predictedNextCGPA: number;
  predictionConfidence: number;
  predictionMethod?: 'random_forest_ensemble' | 'polynomial' | 'ewma' | 'ensemble';
  predictionBreakdown?: {
    polynomial?: number;
    randomForest?: number;
    ewma: number;
  };
  recommendedSubjects: string[];
  consistencyScore: number;
  consistencyLabel: 'Excellent' | 'Good' | 'Average' | 'Inconsistent';
  strengths: string[];
  warnings: string[];
  generatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  program: string;
  batch: string;
  email?: string;
  phone?: string;
  university: string;
  avatarColor: string;
  currentSemester: number;
  semesters: Semester[];
  currentCGPA: number;
  aiInsights?: AIInsights;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  username: string;
  displayName: string;
  loggedInAt: string;
  expiresAt: string;
}
