'use client';
import { useState, useRef } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { Student } from '@/types/student';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import CGPATrendChart from '@/components/charts/CGPATrendChart';
import SubjectBarChart from '@/components/charts/SubjectBarChart';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import GradeDistributionPie from '@/components/charts/GradeDistributionPie';
import {
  buildCGPATrend, buildSubjectBar, buildRadarData, buildGradeDistribution,
} from '@/lib/chartTransformers';
import { cgpaBadgeColor } from '@/constants/gradePoints';

export default function ReportsPage() {
  const { students } = useStudents();
  const [selectedId, setSelectedId] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const student = students.find((s) => s.id === selectedId) ?? null;
  const sorted = student ? [...student.semesters].sort((a, b) => a.semesterNumber - b.semesterNumber) : [];

  const avgAttendance = sorted.length
    ? Math.round(sorted.reduce((acc, s) => acc + s.overallAttendance, 0) / sorted.length)
    : 0;

  const handleDownload = async () => {
    if (!student || !reportRef.current) return;
    setDownloading(true);
    try {
      const { downloadStudentReport } = await import('@/lib/reportGenerator');
      await downloadStudentReport('acadpulse-report', student.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Could not open print window: ${msg}\n\nTip: Allow popups for this site, or use Ctrl+P to print manually.`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Controls */}
      <Card title="Generate Report" subtitle="Select a student and download their performance report">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Select Student</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">— Choose a student —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleDownload}
            loading={downloading}
            disabled={!student}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            Print / Save PDF
          </Button>
        </div>
      </Card>

      {!student ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Select a student to preview their report</p>
        </div>
      ) : (
        /* Report Preview */
        <div id="acadpulse-report" ref={reportRef} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">AcadPulse</h1>
                <p className="text-indigo-200 text-xs">Academic Performance Report</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <Avatar name={student.name} color="rgba(255,255,255,0.3)" size="xl" />
              <div>
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <p className="text-indigo-200">{student.rollNumber}</p>
                <p className="text-indigo-200 text-sm mt-1">{student.program} · {student.department}</p>
                <p className="text-indigo-200 text-xs">Batch: {student.batch || '—'} · {student.university || '—'}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-4xl font-black">{student.currentCGPA.toFixed(2)}</p>
                <p className="text-indigo-200 text-sm">Current CGPA</p>
                {student.aiInsights && (
                  <p className="text-white/80 text-xs mt-1">
                    Consistency: {student.aiInsights.consistencyScore}/100 ({student.aiInsights.consistencyLabel})
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 text-xs text-indigo-200">
              Generated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Semesters', value: sorted.length, color: 'text-indigo-600' },
                { label: 'Avg Attendance', value: `${avgAttendance}%`, color: avgAttendance >= 75 ? 'text-green-600' : 'text-red-600' },
                { label: 'Total Credits', value: sorted.reduce((acc, s) => acc + s.totalCredits, 0), color: 'text-purple-600' },
                { label: 'Total Backlogs', value: sorted.reduce((acc, s) => acc + s.backlogs, 0), color: 'text-red-600' },
              ].map((s) => (
                <div key={s.label} className="text-center p-4 rounded-xl bg-gray-50">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* CGPA Trend */}
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3">CGPA Trend</h3>
              <CGPATrendChart data={buildCGPATrend(sorted)} height={240} />
            </div>

            {/* Semester table */}
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3">Semester Summary</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-200">
                    {['Semester', 'Year', 'SGPA', 'CGPA', 'Credits', 'Attendance', 'Backlogs'].map((h) => (
                      <th key={h} className="text-left py-2 pr-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((sem) => (
                    <tr key={sem.id} className="border-b border-gray-100">
                      <td className="py-2 pr-3 font-medium">Sem {sem.semesterNumber}</td>
                      <td className="py-2 pr-3 text-gray-500 text-xs">{sem.academicYear || '—'}</td>
                      <td className="py-2 pr-3 font-semibold text-indigo-600">{sem.sgpa.toFixed(2)}</td>
                      <td className="py-2 pr-3 font-semibold text-emerald-600">{sem.cgpaAfterSemester.toFixed(2)}</td>
                      <td className="py-2 pr-3 text-gray-600">{sem.totalCredits}</td>
                      <td className="py-2 pr-3"><span className={`text-xs px-1.5 py-0.5 rounded ${sem.overallAttendance >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{sem.overallAttendance}%</span></td>
                      <td className="py-2 pr-3 text-gray-600">{sem.backlogs || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Charts Grid */}
            {sorted.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Subject Performance (Latest Sem)</h3>
                  <SubjectBarChart data={buildSubjectBar(sorted[sorted.length - 1])} height={220} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Grade Distribution</h3>
                  <GradeDistributionPie grades={buildGradeDistribution(sorted)} height={220} />
                </div>
                <div className="col-span-2">
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Skill Strength Radar</h3>
                  <SkillRadarChart data={buildRadarData(sorted)} height={260} />
                </div>
              </div>
            )}

            {/* AI Insights */}
            {student.aiInsights && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3">AI Insights</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-medium">Predicted Next SGPA</p>
                    <p className="text-2xl font-bold text-indigo-700">{student.aiInsights.predictedNextSGPA.toFixed(2)}</p>
                    <p className="text-xs text-indigo-400">Confidence: {Math.round(student.aiInsights.predictionConfidence * 100)}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-medium">Consistency Score</p>
                    <p className="text-2xl font-bold text-emerald-700">{student.aiInsights.consistencyScore}/100</p>
                    <p className="text-xs text-emerald-400">{student.aiInsights.consistencyLabel}</p>
                  </div>
                </div>
                {student.aiInsights.strengths.length > 0 && (
                  <div className="mt-3 p-4 rounded-xl bg-green-50 border border-green-100">
                    <p className="text-xs font-semibold text-green-800 mb-1">Strengths</p>
                    <ul className="text-xs text-green-700 space-y-0.5">
                      {student.aiInsights.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                )}
                {student.aiInsights.warnings.length > 0 && (
                  <div className="mt-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-800 mb-1">Areas to Improve</p>
                    <ul className="text-xs text-amber-700 space-y-0.5">
                      {student.aiInsights.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
              Report generated by AcadPulse · {new Date().toLocaleDateString()} · For academic tracking purposes only
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
