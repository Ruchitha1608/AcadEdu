'use client';
import { useState, useMemo } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { Student } from '@/types/student';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import CGPATrendChart from '@/components/charts/CGPATrendChart';
import ComparisonChart from '@/components/charts/ComparisonChart';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import { buildCGPATrend, buildRadarData, buildComparisonData } from '@/lib/chartTransformers';
import { STUDENT_COLORS } from '@/constants/chartColors';
import { cgpaBadgeColor } from '@/constants/gradePoints';

const METRICS = ['Current CGPA', 'Attendance %', 'Backlogs', 'Consistency'];

export default function ComparePage() {
  const { students } = useStudents();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const selected = useMemo(
    () => selectedIds.map((id) => students.find((s) => s.id === id)).filter(Boolean) as Student[],
    [selectedIds, students]
  );

  const compData = useMemo(() => buildComparisonData(selected, METRICS), [selected]);

  // Aligned CGPA trend for multi-student
  const maxSem = useMemo(() => Math.max(0, ...selected.map((s) => s.semesters.length)), [selected]);
  const alignedTrend = useMemo(() => {
    if (!selected.length) return [];
    return Array.from({ length: maxSem + 1 }, (_, i) => {
      const label = i < maxSem ? `Sem ${i + 1}` : `Sem ${maxSem + 1} (P)`;
      const point: Record<string, number | string | boolean> = { semester: label };
      for (const s of selected) {
        const sorted = [...s.semesters].sort((a, b) => a.semesterNumber - b.semesterNumber);
        if (i < sorted.length) {
          point[`${s.name}_cgpa`] = sorted[i].cgpaAfterSemester;
          point[`${s.name}_sgpa`] = sorted[i].sgpa;
        } else if (i === sorted.length && s.aiInsights) {
          point[`${s.name}_cgpa`] = s.aiInsights.predictedNextCGPA;
          point[`${s.name}_sgpa`] = s.aiInsights.predictedNextSGPA;
        }
      }
      return point;
    });
  }, [selected, maxSem]);

  // Radar for each selected student
  const radarStudents = useMemo(() =>
    selected.map((s, i) => ({
      name: s.name,
      data: buildRadarData(s.semesters),
      color: STUDENT_COLORS[i % STUDENT_COLORS.length].primary,
    })),
    [selected]
  );

  const avgAttendance = (s: Student) => s.semesters.length
    ? Math.round(s.semesters.reduce((acc, sem) => acc + sem.overallAttendance, 0) / s.semesters.length) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Student selector */}
      <Card title="Select Students to Compare" subtitle="Choose 2 to 3 students">
        {students.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No students available. Add students first.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {students.map((s, i) => {
              const isSelected = selectedIds.includes(s.id);
              const colorIdx = selectedIds.indexOf(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  disabled={!isSelected && selectedIds.length >= 3}
                  className={`p-3 rounded-xl border-2 text-left transition-all
                    ${isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-100 bg-white hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                        style={{ backgroundColor: STUDENT_COLORS[colorIdx % STUDENT_COLORS.length].primary }}>
                        {colorIdx + 1}
                      </div>
                    )}
                    <Avatar name={s.name} color={s.avatarColor} size="sm" />
                  </div>
                  <p className="text-xs font-medium text-gray-800 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.department}</p>
                  <span className={`mt-1 inline-block text-xs font-bold px-1.5 py-0.5 rounded-full border ${cgpaBadgeColor(s.currentCGPA)}`}>
                    {s.currentCGPA.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {selected.length >= 2 ? (
        <>
          {/* Header row */}
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
            {selected.map((s, i) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"
                style={{ borderTopColor: STUDENT_COLORS[i % STUDENT_COLORS.length].primary, borderTopWidth: 3 }}>
                <Avatar name={s.name} color={STUDENT_COLORS[i % STUDENT_COLORS.length].primary} size="lg" className="mx-auto" />
                <h3 className="text-base font-bold text-gray-900 mt-2">{s.name}</h3>
                <p className="text-xs text-gray-500">{s.rollNumber}</p>
                <p className={`text-2xl font-bold mt-2 ${cgpaBadgeColor(s.currentCGPA).split(' ')[0].replace('bg', 'text').replace('-100', '-600')}`}>
                  {s.currentCGPA.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">CGPA</p>
              </div>
            ))}
          </div>

          {/* Comparison bar chart */}
          <Card title="Metric Comparison" subtitle="Side-by-side key metrics">
            <ComparisonChart
              data={compData}
              students={selected.map((s) => s.name)}
              height={280}
            />
          </Card>

          {/* CGPA Trend comparison */}
          <Card title="CGPA Trend Comparison" subtitle="Semester-wise performance overlay">
            <div className="space-y-1">
              {selected.map((s, i) => (
                <div key={s.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STUDENT_COLORS[i % STUDENT_COLORS.length].primary }} />
                    <span className="text-xs font-medium text-gray-600">{s.name}</span>
                  </div>
                  <CGPATrendChart data={buildCGPATrend(s.semesters)} height={120} compact />
                  {i < selected.length - 1 && <div className="my-3 border-t border-gray-50" />}
                </div>
              ))}
            </div>
          </Card>

          {/* Skill Radar */}
          <Card title="Skill Strength Comparison" subtitle="Overlapping radar across subject categories">
            <SkillRadarChart data={[]} students={radarStudents} height={340} />
          </Card>

          {/* Comparison Table */}
          <Card title="Detailed Comparison">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left py-2 pr-4 font-medium">Metric</th>
                    {selected.map((s) => (
                      <th key={s.id} className="text-right py-2 pr-4 font-medium">{s.name.split(' ')[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Current CGPA', fn: (s: Student) => s.currentCGPA.toFixed(2), higher: true },
                    { label: 'Best SGPA', fn: (s: Student) => s.semesters.length ? Math.max(...s.semesters.map((sem) => sem.sgpa)).toFixed(2) : '—', higher: true },
                    { label: 'Worst SGPA', fn: (s: Student) => s.semesters.length ? Math.min(...s.semesters.map((sem) => sem.sgpa)).toFixed(2) : '—', higher: true },
                    { label: 'Avg Attendance', fn: (s: Student) => `${avgAttendance(s)}%`, higher: true },
                    { label: 'Total Backlogs', fn: (s: Student) => s.semesters.reduce((acc, sem) => acc + sem.backlogs, 0).toString(), higher: false },
                    { label: 'Consistency Score', fn: (s: Student) => s.aiInsights ? `${s.aiInsights.consistencyScore}/100` : '—', higher: true },
                    { label: 'Total Credits', fn: (s: Student) => s.semesters.reduce((acc, sem) => acc + sem.totalCredits, 0).toString(), higher: true },
                    { label: 'Predicted CGPA', fn: (s: Student) => s.aiInsights ? s.aiInsights.predictedNextCGPA.toFixed(2) : '—', higher: true },
                  ].map(({ label, fn }) => (
                    <tr key={label} className="border-b border-gray-50">
                      <td className="py-2.5 pr-4 text-gray-500 text-xs">{label}</td>
                      {selected.map((s) => (
                        <td key={s.id} className="py-2.5 pr-4 text-right font-medium text-gray-800 text-xs">{fn(s)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        selected.length === 1 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Select one more student to compare</div>
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm">Select 2 or 3 students above to start comparing</div>
        )
      )}
    </div>
  );
}
