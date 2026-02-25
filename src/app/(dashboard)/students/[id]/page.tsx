'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStudents } from '@/hooks/useStudents';
import { Student, AIInsights, Semester } from '@/types/student';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Tabs, { TabItem } from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import CGPATrendChart from '@/components/charts/CGPATrendChart';
import SubjectBarChart from '@/components/charts/SubjectBarChart';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import GradeDistributionPie from '@/components/charts/GradeDistributionPie';
import AttendanceHeatmap from '@/components/charts/AttendanceHeatmap';
import AIInsightsPanel from '@/components/student/AIInsightsPanel';
import {
  buildCGPATrend, buildSubjectBar, buildRadarData,
  buildGradeDistribution, buildAttendanceHeatmap,
} from '@/lib/chartTransformers';
import { cgpaBadgeColor } from '@/constants/gradePoints';

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { getById, editStudent } = useStudents();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [selectedSemIdx, setSelectedSemIdx] = useState(0);

  useEffect(() => {
    const s = getById(id);
    if (!s) {
      router.replace('/students');
    } else {
      setStudent(s);
      setSelectedSemIdx(Math.max(0, s.semesters.length - 1));
    }
  }, [id, getById, router]);

  if (!student) return null;

  const handleInsightsUpdate = (insights: AIInsights) => {
    const updated = { ...student, aiInsights: insights };
    setStudent(updated);
    editStudent(updated);
  };

  const sorted = [...student.semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);
  const currentSem: Semester | undefined = sorted[selectedSemIdx];

  const totalBacklogs = sorted.reduce((acc, s) => acc + s.backlogs, 0);
  const avgAttendance = sorted.length
    ? Math.round(sorted.reduce((acc, s) => acc + s.overallAttendance, 0) / sorted.length)
    : 0;

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card title="CGPA Trend" subtitle="Semester-wise SGPA and cumulative CGPA">
              <CGPATrendChart data={buildCGPATrend(sorted)} height={260} />
            </Card>
            <Card title="Grade Distribution" subtitle="All semesters combined">
              <GradeDistributionPie grades={buildGradeDistribution(sorted)} height={260} />
            </Card>
          </div>

          {/* Semester Table */}
          <Card title="Semester Summary">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left py-2 pr-4 font-medium">Semester</th>
                    <th className="text-left py-2 pr-4 font-medium">Year</th>
                    <th className="text-right py-2 pr-4 font-medium">SGPA</th>
                    <th className="text-right py-2 pr-4 font-medium">CGPA</th>
                    <th className="text-right py-2 pr-4 font-medium">Credits</th>
                    <th className="text-right py-2 pr-4 font-medium">Attendance</th>
                    <th className="text-right py-2 font-medium">Backlogs</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((sem) => (
                    <tr key={sem.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-gray-800">Sem {sem.semesterNumber}</td>
                      <td className="py-2.5 pr-4 text-gray-500 text-xs">{sem.academicYear || '—'}</td>
                      <td className="py-2.5 pr-4 text-right font-semibold text-indigo-600">{sem.sgpa.toFixed(2)}</td>
                      <td className="py-2.5 pr-4 text-right font-semibold text-emerald-600">{sem.cgpaAfterSemester.toFixed(2)}</td>
                      <td className="py-2.5 pr-4 text-right text-gray-600">{sem.totalCredits}</td>
                      <td className="py-2.5 pr-4 text-right">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sem.overallAttendance >= 85 ? 'bg-green-100 text-green-700' : sem.overallAttendance >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {sem.overallAttendance}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {sem.backlogs > 0
                          ? <span className="text-xs font-medium text-red-600">{sem.backlogs}</span>
                          : <span className="text-xs text-green-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'academics',
      label: 'Academics',
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      content: (
        <div className="space-y-5">
          {/* Semester selector */}
          {sorted.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {sorted.map((sem, idx) => (
                <button key={sem.id} onClick={() => setSelectedSemIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${idx === selectedSemIdx ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Sem {sem.semesterNumber}
                </button>
              ))}
            </div>
          )}

          {currentSem ? (
            <div className="space-y-5">
              <Card title={`Semester ${currentSem.semesterNumber} — Subject Grade Comparison`} subtitle={`SGPA: ${currentSem.sgpa.toFixed(2)} | Subjects: ${currentSem.subjects.length}`}>
                <SubjectBarChart data={buildSubjectBar(currentSem)} height={280} />
              </Card>

              <Card title="Skill Strength Radar" subtitle="Subject category performance">
                <SkillRadarChart data={buildRadarData(sorted)} height={300} />
              </Card>

              {/* Subject table */}
              <Card title="Subject Details">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        <th className="text-left py-2 pr-4 font-medium">Code</th>
                        <th className="text-left py-2 pr-4 font-medium">Subject</th>
                        <th className="text-right py-2 pr-4 font-medium">Credits</th>
                        <th className="text-right py-2 pr-4 font-medium">Grade</th>
                        <th className="text-right py-2 pr-4 font-medium">Grade Pt</th>
                        <th className="text-right py-2 font-medium">Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSem.subjects.map((sub) => (
                        <tr key={sub.id} className="border-b border-gray-50">
                          <td className="py-2.5 pr-4 text-gray-500 text-xs">{sub.code || '—'}</td>
                          <td className="py-2.5 pr-4 font-medium text-gray-800">{sub.name}</td>
                          <td className="py-2.5 pr-4 text-right text-gray-600">{sub.credits}</td>
                          <td className="py-2.5 pr-4 text-right">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sub.gradePoint >= 9 ? 'bg-green-100 text-green-700' : sub.gradePoint >= 7 ? 'bg-blue-100 text-blue-700' : sub.gradePoint >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-right text-gray-600">{sub.gradePoint}</td>
                          <td className="py-2.5 text-right text-gray-600">
                            {sub.attendancePercentage != null
                              ? <span className={sub.attendancePercentage < 75 ? 'text-red-600 font-medium' : ''}>{sub.attendancePercentage}%</span>
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">No semester data</p>
          )}
        </div>
      ),
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-center">
              <p className="text-xs text-green-600 font-medium">Average</p>
              <p className="text-3xl font-bold text-green-700">{avgAttendance}%</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
              <p className="text-xs text-indigo-600 font-medium">Best Semester</p>
              <p className="text-3xl font-bold text-indigo-700">
                {sorted.length ? Math.max(...sorted.map((s) => s.overallAttendance)) : 0}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
              <p className="text-xs text-red-600 font-medium">Worst Semester</p>
              <p className="text-3xl font-bold text-red-700">
                {sorted.length ? Math.min(...sorted.map((s) => s.overallAttendance)) : 0}%
              </p>
            </div>
          </div>

          <Card title="Attendance Pattern" subtitle="Monthly heatmap across semesters">
            <AttendanceHeatmap data={buildAttendanceHeatmap(sorted)} height={320} />
          </Card>

          {/* Per-semester attendance breakdown */}
          <Card title="Semester Attendance Breakdown">
            <div className="space-y-3">
              {sorted.map((sem) => (
                <div key={sem.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14">Sem {sem.semesterNumber}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${sem.overallAttendance >= 85 ? 'bg-green-500' : sem.overallAttendance >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${sem.overallAttendance}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-10 text-right ${sem.overallAttendance >= 85 ? 'text-green-600' : sem.overallAttendance >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {sem.overallAttendance}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
      content: (
        <Card title="AI-Powered Insights">
          <AIInsightsPanel student={student} onUpdate={handleInsightsUpdate} />
        </Card>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={student.name} color={student.avatarColor} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
              <span className={`text-base font-bold px-3 py-1 rounded-full border ${cgpaBadgeColor(student.currentCGPA)}`}>
                CGPA {student.currentCGPA.toFixed(2)}
              </span>
              {student.aiInsights && (
                <Badge color="indigo">Consistency {student.aiInsights.consistencyScore}/100</Badge>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">{student.rollNumber}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              <span>{student.program} · {student.department}</span>
              <span>Batch: {student.batch || '—'}</span>
              <span>{student.university || '—'}</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <Badge color={avgAttendance >= 85 ? 'green' : avgAttendance >= 75 ? 'yellow' : 'red'} size="md">
                {avgAttendance}% Avg Attendance
              </Badge>
              <Badge color="gray" size="md">Sem {student.currentSemester}</Badge>
              {totalBacklogs > 0 && <Badge color="red" size="md">{totalBacklogs} Backlog(s)</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/students/${student.id}/edit`}>
              <Button variant="secondary" size="sm">Edit</Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" size="sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Report
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <Tabs items={tabs} defaultTab="overview" />
      </div>
    </div>
  );
}
