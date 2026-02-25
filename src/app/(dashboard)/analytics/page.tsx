'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useStudents } from '@/hooks/useStudents';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { cgpaBadgeColor } from '@/constants/gradePoints';
import { buildGradeDistribution } from '@/lib/chartTransformers';
import GradeDistributionPie from '@/components/charts/GradeDistributionPie';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { STUDENT_COLORS } from '@/constants/chartColors';

export default function AnalyticsPage() {
  const { students } = useStudents();

  const stats = useMemo(() => {
    if (!students.length) return null;
    const avgCGPA = students.reduce((acc, s) => acc + s.currentCGPA, 0) / students.length;
    const topStudents = [...students].sort((a, b) => b.currentCGPA - a.currentCGPA).slice(0, 5);

    // Department averages
    const deptMap: Record<string, { total: number; count: number }> = {};
    for (const s of students) {
      const d = s.department || 'Unknown';
      if (!deptMap[d]) deptMap[d] = { total: 0, count: 0 };
      deptMap[d].total += s.currentCGPA;
      deptMap[d].count += 1;
    }
    const deptData = Object.entries(deptMap)
      .map(([dept, { total, count }]) => ({ dept, avg: parseFloat((total / count).toFixed(2)), count }))
      .sort((a, b) => b.avg - a.avg);

    // Aggregated grade distribution
    const allGrades: Record<string, number> = {};
    for (const s of students) {
      const dist = buildGradeDistribution(s.semesters);
      for (const [g, c] of Object.entries(dist)) {
        allGrades[g] = (allGrades[g] ?? 0) + c;
      }
    }

    // Attendance distribution
    const attendanceBuckets = { '90-100%': 0, '75-89%': 0, '60-74%': 0, 'Below 60%': 0 };
    for (const s of students) {
      const avg = s.semesters.length
        ? s.semesters.reduce((acc, sem) => acc + sem.overallAttendance, 0) / s.semesters.length
        : 100;
      if (avg >= 90) attendanceBuckets['90-100%']++;
      else if (avg >= 75) attendanceBuckets['75-89%']++;
      else if (avg >= 60) attendanceBuckets['60-74%']++;
      else attendanceBuckets['Below 60%']++;
    }

    // CGPA distribution
    const cgpaBuckets = [
      { range: '9-10', count: 0 }, { range: '8-9', count: 0 },
      { range: '7-8', count: 0 }, { range: '6-7', count: 0 }, { range: 'Below 6', count: 0 },
    ];
    for (const s of students) {
      const c = s.currentCGPA;
      if (c >= 9) cgpaBuckets[0].count++;
      else if (c >= 8) cgpaBuckets[1].count++;
      else if (c >= 7) cgpaBuckets[2].count++;
      else if (c >= 6) cgpaBuckets[3].count++;
      else cgpaBuckets[4].count++;
    }

    return { avgCGPA, topStudents, deptData, allGrades, attendanceBuckets, cgpaBuckets };
  }, [students]);

  if (!students.length) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-500">No data yet. <Link href="/students/new" className="text-indigo-600 font-medium">Add students</Link> to see analytics.</p>
      </div>
    );
  }

  const bucketColors = ['#22c55e', '#3b82f6', '#eab308', '#ef4444'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: students.length, color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
          { label: 'Avg CGPA', value: stats?.avgCGPA.toFixed(2) ?? '—', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
          { label: 'Departments', value: stats?.deptData.length ?? 0, color: 'bg-amber-50 border-amber-100 text-amber-700' },
          { label: 'With AI Insights', value: students.filter((s) => s.aiInsights).length, color: 'bg-purple-50 border-purple-100 text-purple-700' },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl p-5 border ${card.color}`}>
            <p className="text-xs font-medium opacity-70">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department CGPA */}
        <Card title="Department-wise Average CGPA">
          {stats?.deptData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.deptData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [Number(v).toFixed(2), 'Avg CGPA']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="avg" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {stats.deptData.map((_, i) => (
                    <Cell key={i} fill={STUDENT_COLORS[i % STUDENT_COLORS.length].primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 py-8 text-center">No department data</p>}
        </Card>

        {/* Grade Distribution */}
        <Card title="Overall Grade Distribution" subtitle="All students & semesters combined">
          <GradeDistributionPie grades={stats?.allGrades ?? {}} height={260} />
        </Card>

        {/* CGPA Distribution */}
        <Card title="CGPA Distribution" subtitle="How students are spread across CGPA ranges">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.cgpaBuckets ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={52}>
                {(stats?.cgpaBuckets ?? []).map((_, i) => (
                  <Cell key={i} fill={bucketColors[Math.min(i, bucketColors.length - 1)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Attendance Distribution */}
        <Card title="Attendance Distribution" subtitle="Students by attendance range">
          {stats && (
            <div className="space-y-3 pt-2">
              {Object.entries(stats.attendanceBuckets).map(([range, count], i) => (
                <div key={range} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24">{range}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center pl-2 transition-all text-xs text-white font-medium"
                      style={{
                        width: `${students.length ? (count / students.length) * 100 : 0}%`,
                        backgroundColor: bucketColors[i],
                        minWidth: count > 0 ? '2rem' : 0,
                      }}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Leaderboard */}
      <Card title="Top Performers" subtitle="Ranked by current CGPA">
        <div className="space-y-2">
          {stats?.topStudents.map((s, i) => (
            <Link key={s.id} href={`/students/${s.id}`}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: i === 0 ? '#fef3c7' : i === 1 ? '#f3f4f6' : i === 2 ? '#fef3c7' : '#f9fafb', color: i === 0 ? '#d97706' : i === 1 ? '#6b7280' : '#92400e' }}>
                {i + 1}
              </div>
              <Avatar name={s.name} color={s.avatarColor} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600">{s.name}</p>
                <p className="text-xs text-gray-400">{s.department} · {s.rollNumber}</p>
              </div>
              <span className={`text-sm font-bold px-2.5 py-1 rounded-full border ${cgpaBadgeColor(s.currentCGPA)}`}>
                {s.currentCGPA.toFixed(2)}
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
