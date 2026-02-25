import { Student, Semester } from '@/types/student';
import { CGPATrendDataPoint, SubjectBarDataPoint, RadarDataPoint, HeatmapCell } from '@/types/chart';
import { predictNextSemester } from './predictions';

export function buildCGPATrend(semesters: Semester[], showPrediction = true): CGPATrendDataPoint[] {
  const sorted = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);
  const actual: CGPATrendDataPoint[] = sorted.map((s) => ({
    semester: `Sem ${s.semesterNumber}`,
    sgpa: s.sgpa,
    cgpa: s.cgpaAfterSemester,
    isPredicted: false,
  }));

  if (showPrediction && sorted.length >= 1) {
    const { predictedSGPA, predictedCGPA } = predictNextSemester(sorted);
    actual.push({
      semester: `Sem ${sorted.length + 1} (P)`,
      sgpa: predictedSGPA,
      cgpa: predictedCGPA,
      isPredicted: true,
    });
  }

  return actual;
}

export function buildSubjectBar(semester: Semester): SubjectBarDataPoint[] {
  return semester.subjects.map((s) => ({
    subject: s.name.length > 20 ? s.name.slice(0, 20) + '…' : s.name,
    code: s.code,
    gradePoint: s.gradePoint,
    credits: s.credits,
    attendance: s.attendancePercentage,
    grade: s.grade,
  }));
}

const AXIS_KEYWORDS: Record<string, string[]> = {
  Mathematics: ['math', 'calculus', 'algebra', 'statistics', 'probability', 'discrete', 'numerical'],
  Programming: ['programming', 'algorithm', 'data structure', 'software', 'python', 'java', 'c++', 'coding', 'web'],
  Systems: ['operating system', 'network', 'database', 'architecture', 'compiler', 'embedded', 'distributed'],
  Design: ['design', 'ui', 'ux', 'graphics', 'visual', 'hci', 'multimedia'],
  Communication: ['english', 'communication', 'technical writing', 'presentation', 'aptitude', 'language'],
  'Lab/Practical': ['lab', 'practical', 'workshop', 'project', 'internship', 'mini project'],
};

export function buildRadarData(semesters: Semester[]): RadarDataPoint[] {
  const axisAccum: Record<string, { total: number; count: number }> = {};
  for (const axis of Object.keys(AXIS_KEYWORDS)) {
    axisAccum[axis] = { total: 0, count: 0 };
  }

  for (const sem of semesters) {
    for (const sub of sem.subjects) {
      const lower = sub.name.toLowerCase();
      let matched = false;
      for (const [axis, keywords] of Object.entries(AXIS_KEYWORDS)) {
        if (keywords.some((kw) => lower.includes(kw))) {
          axisAccum[axis].total += sub.gradePoint;
          axisAccum[axis].count += 1;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // default to Programming
        axisAccum['Programming'].total += sub.gradePoint;
        axisAccum['Programming'].count += 1;
      }
    }
  }

  return Object.entries(axisAccum).map(([skill, data]) => ({
    skill,
    score: data.count > 0 ? parseFloat((data.total / data.count).toFixed(2)) : 0,
    fullMark: 10,
  }));
}

export function buildGradeDistribution(semesters: Semester[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const sem of semesters) {
    for (const sub of sem.subjects) {
      const g = sub.grade || 'Unknown';
      dist[g] = (dist[g] ?? 0) + 1;
    }
  }
  return dist;
}

export function buildAttendanceHeatmap(semesters: Semester[]): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const sorted = [...semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);

  for (const sem of sorted) {
    if (sem.attendance && sem.attendance.length > 0) {
      for (const rec of sem.attendance) {
        cells.push({
          month: rec.month,
          semester: sem.semesterNumber,
          value: rec.percentage,
        });
      }
    } else {
      // Synthetic monthly data from overall attendance
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      for (const m of months) {
        cells.push({
          month: m,
          semester: sem.semesterNumber,
          value: sem.overallAttendance + (Math.random() * 10 - 5),
        });
      }
    }
  }

  return cells;
}

export function buildComparisonData(students: Student[], metrics: string[]) {
  return metrics.map((metric) => {
    const entry: Record<string, number | string> = { metric };
    for (const student of students) {
      switch (metric) {
        case 'Current CGPA':
          entry[student.name] = student.currentCGPA;
          break;
        case 'Attendance %':
          entry[student.name] = student.semesters.length
            ? parseFloat(
                (
                  student.semesters.reduce((acc, s) => acc + s.overallAttendance, 0) / student.semesters.length
                ).toFixed(1)
              )
            : 0;
          break;
        case 'Backlogs':
          entry[student.name] = student.semesters.reduce((acc, s) => acc + s.backlogs, 0);
          break;
        case 'Consistency':
          entry[student.name] = student.aiInsights?.consistencyScore ?? 0;
          break;
      }
    }
    return entry;
  });
}
